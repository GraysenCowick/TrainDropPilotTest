import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import ffmpegPathPkg from "@ffmpeg-installer/ffmpeg";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import type { TranscriptSegment } from "./whisper";

const execFileAsync = promisify(execFile);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a time-aligned voiceover by:
 * 1. Generating TTS audio for each Whisper segment individually
 * 2. Placing each clip at its original timestamp using FFmpeg adelay + amix
 *
 * This keeps narration in sync with what's happening on screen — the voiceover
 * for segment N always starts at the same time the speaker started saying it.
 */
export async function generateVoiceover(
  segments: TranscriptSegment[],
  moduleId: string
): Promise<string> {
  const tmpDir = os.tmpdir();
  const id = Date.now();
  const tempFiles: string[] = [];

  try {
    // Filter out empty/whitespace-only segments
    const valid = segments.filter((s) => s.text.trim().length > 0);
    if (valid.length === 0) throw new Error("No text segments for voiceover");

    // ── 1. Generate TTS for each segment ─────────────────────────────────
    const segFiles: string[] = [];
    for (let i = 0; i < valid.length; i++) {
      const seg = valid[i];
      const response = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "onyx",
        input: seg.text.trim(),
        response_format: "mp3",
      });
      const filePath = path.join(tmpDir, `td-tts-${id}-${i}.mp3`);
      fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
      segFiles.push(filePath);
      tempFiles.push(filePath);
      console.log(`[TTS] Segment ${i}: start=${seg.start.toFixed(2)}s — "${seg.text.trim().slice(0, 60)}"`);
    }

    // ── 2. Assemble with FFmpeg: adelay each clip to its original timestamp ──
    const outputFile = path.join(tmpDir, `td-voiceover-${id}.mp3`);
    tempFiles.push(outputFile);
    await assembleSegments(segFiles, valid.map((s) => s.start), outputFile);

    // ── 3. Upload to Supabase ─────────────────────────────────────────────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const storagePath = `voiceovers/${moduleId}.mp3`;
    const { error } = await supabase.storage
      .from("processed")
      .upload(storagePath, fs.readFileSync(outputFile), {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (error) throw new Error(`Failed to upload voiceover: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from("processed")
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } finally {
    tempFiles.forEach((f) => fs.unlink(f, () => {}));
  }
}

/**
 * Uses FFmpeg adelay to place each segment at its correct timestamp, then
 * amix to merge all delayed streams into a single track.
 *
 * adelay values are in milliseconds (per channel, so "5200|5200" for stereo).
 * normalize=0 prevents amix from reducing volume when streams overlap.
 */
async function assembleSegments(
  segFiles: string[],
  startTimes: number[], // seconds
  outputFile: string
): Promise<void> {
  const N = segFiles.length;

  if (N === 1) {
    const delayMs = Math.round(startTimes[0] * 1000);
    await execFileAsync(ffmpegPathPkg.path, [
      "-i", segFiles[0],
      "-af", `adelay=${delayMs}|${delayMs}`,
      "-c:a", "libmp3lame", "-q:a", "2",
      outputFile,
    ]);
    return;
  }

  // Build: [0]adelay=X|X[a0];[1]adelay=Y|Y[a1];...;[a0][a1]...amix=inputs=N:...
  const filterParts: string[] = [];
  const labels: string[] = [];
  for (let i = 0; i < N; i++) {
    const delayMs = Math.round(startTimes[i] * 1000);
    filterParts.push(`[${i}]adelay=${delayMs}|${delayMs}[a${i}]`);
    labels.push(`[a${i}]`);
  }
  const filterComplex =
    filterParts.join(";") +
    ";" +
    labels.join("") +
    `amix=inputs=${N}:duration=longest:normalize=0`;

  const args: string[] = [];
  for (const f of segFiles) args.push("-i", f);
  args.push("-filter_complex", filterComplex, "-c:a", "libmp3lame", "-q:a", "2", outputFile);

  console.log(`[TTS] Assembling ${N} segments with FFmpeg adelay+amix`);
  await execFileAsync(ffmpegPathPkg.path, args);
}
