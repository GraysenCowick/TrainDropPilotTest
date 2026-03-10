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
 * Download an audio file (WAV extracted client-side) and transcribe with Whisper.
 * Audio files are tiny (~1 MB per minute at 16 kHz mono) so there is no size issue.
 */
export async function transcribeVideo(
  audioUrl: string
): Promise<WhisperTranscript> {
  const tmpDir = os.tmpdir();
  const id = Date.now();
  const urlPath = new URL(audioUrl).pathname;
  const ext = path.extname(urlPath) || ".wav";
  const audioFile = path.join(tmpDir, `td-audio-${id}${ext}`);

  // ── 1. Download the audio ──────────────────────────────────────────────────
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();

  // Whisper API limit is 25 MB. A 16 kHz mono WAV is ~32 KB/s so this allows
  // up to ~13 minutes of audio. Typical training videos are well under this.
  if (buffer.byteLength > 24 * 1024 * 1024) {
    throw new Error(
      `Audio file is ${Math.round(buffer.byteLength / 1024 / 1024)} MB — video is too long (max ~13 minutes). Please trim it and try again.`
    );
  }

  fs.writeFileSync(audioFile, Buffer.from(buffer));

  try {
    // ── 2. Transcribe with OpenAI Whisper ────────────────────────────────────
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

    console.log(`[Whisper] ${segments.length} segments, duration: ${transcription.duration ?? 0}s`);

    return {
      text: transcription.text,
      segments,
      words,
      duration: transcription.duration ?? 0,
    };
  } finally {
    fs.unlink(audioFile, () => {});
  }
}
