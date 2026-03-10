import OpenAI from "openai";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

// Point fluent-ffmpeg at the bundled binary (no system install required)
ffmpeg.setFfmpegPath(ffmpegPath.path);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

export interface WhisperTranscript {
  text: string;
  segments: TranscriptSegment[];
  words: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  duration: number;
}

// Verbose transcription type not fully exposed in openai SDK
interface VerboseTranscription {
  text: string;
  duration?: number;
  words?: Array<{ word: string; start: number; end: number }>;
  segments?: Array<{ text: string; start: number; end: number }>;
}

/**
 * Download the video file, extract audio as low-bitrate MP3 (typically ~2 MB
 * for a 5-minute video), then transcribe with OpenAI Whisper.
 *
 * Audio extraction keeps us well under Whisper's 25 MB file-size limit
 * regardless of how large the original video is.
 */
export async function transcribeVideo(
  videoUrl: string
): Promise<WhisperTranscript> {
  const tmpDir = os.tmpdir();
  const id = Date.now();
  const videoFile = path.join(tmpDir, `td-video-${id}.mp4`);
  const audioFile = path.join(tmpDir, `td-audio-${id}.mp3`);

  // ── 1. Download the video ────────────────────────────────────────────────
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(videoFile, Buffer.from(buffer));

  try {
    // ── 2. Extract audio track as 64 kbps mono MP3 ──────────────────────
    //    64 kbps × 300 seconds = ~2.4 MB — well under the 25 MB Whisper limit
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoFile)
        .noVideo()
        .audioChannels(1)
        .audioBitrate("64k")
        .format("mp3")
        .on("end", () => resolve())
        .on("error", (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
        .save(audioFile);
    });

    // ── 3. Transcribe with OpenAI Whisper ────────────────────────────────
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
    }) as unknown as VerboseTranscription;

    const segments = (transcription.segments ?? []).map((s) => ({
      text: s.text,
      start: s.start,
      end: s.end,
    }));

    const words = (transcription.words ?? []).map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));

    // Log segment timestamps so we can verify alignment
    console.log(`[Whisper] ${segments.length} segments, duration: ${transcription.duration ?? 0}s`);
    segments.forEach((seg, i) => {
      console.log(`  [${i}] ${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s: "${seg.text.trim()}"`);
    });

    return {
      text: transcription.text,
      segments,
      words,
      duration: transcription.duration ?? 0,
    };
  } finally {
    // Clean up both temp files regardless of success or failure
    fs.unlink(videoFile, () => {});
    fs.unlink(audioFile, () => {});
  }
}
