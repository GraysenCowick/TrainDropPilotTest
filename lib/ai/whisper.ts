import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";

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
 * Download the video file and transcribe directly with OpenAI Whisper.
 * Whisper accepts video files natively (mp4, mov, m4a, etc.) up to 25 MB.
 * FFmpeg audio extraction is skipped — it requires native binaries that
 * are unreliable in Vercel serverless environments.
 */
export async function transcribeVideo(
  videoUrl: string
): Promise<WhisperTranscript> {
  const tmpDir = os.tmpdir();
  const id = Date.now();

  // Determine extension from URL
  const urlPath = new URL(videoUrl).pathname;
  const ext = path.extname(urlPath) || ".mp4";
  const videoFile = path.join(tmpDir, `td-video-${id}${ext}`);

  // ── 1. Download the video ──────────────────────────────────────────────────
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > 24 * 1024 * 1024) {
    throw new Error(
      `Video file is ${Math.round(buffer.byteLength / 1024 / 1024)}MB — please keep training videos under 24MB (roughly 2–3 minutes at standard quality).`
    );
  }

  fs.writeFileSync(videoFile, Buffer.from(buffer));

  try {
    // ── 2. Transcribe directly with OpenAI Whisper ───────────────────────────
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(videoFile),
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

    console.log(`[Whisper] ${segments.length} segments, duration: ${transcription.duration ?? 0}s`);

    return {
      text: transcription.text,
      segments,
      words,
      duration: transcription.duration ?? 0,
    };
  } finally {
    fs.unlink(videoFile, () => {});
  }
}
