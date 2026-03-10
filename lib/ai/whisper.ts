import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

// Keep same interfaces so the rest of the codebase doesn't change
export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

export interface WhisperTranscript {
  text: string;
  segments: TranscriptSegment[];
  words: Array<{ word: string; start: number; end: number }>;
  duration: number;
}

/**
 * Submit a video/audio URL to AssemblyAI for async transcription.
 * Returns the job ID immediately (< 1s). No file size limit.
 */
export async function startTranscription(videoUrl: string): Promise<string> {
  const transcript = await client.transcripts.submit({
    audio_url: videoUrl,
    punctuate: true,
    format_text: true,
  });
  return transcript.id;
}

/**
 * Check the status of an AssemblyAI transcription job.
 * Returns the result (in WhisperTranscript format) when completed.
 */
export async function getTranscription(jobId: string): Promise<{
  status: "queued" | "processing" | "completed" | "error";
  result?: WhisperTranscript;
  errorMessage?: string;
}> {
  const transcript = await client.transcripts.get(jobId);

  if (transcript.status === "error") {
    return { status: "error", errorMessage: transcript.error ?? "Transcription failed" };
  }

  if (transcript.status === "completed") {
    // AssemblyAI word timestamps are in milliseconds → convert to seconds
    const words = (transcript.words ?? []).map((w) => ({
      word: w.text,
      start: w.start / 1000,
      end: w.end / 1000,
    }));

    // Group words into ~10-word segments for the chapters/VTT
    const segments: TranscriptSegment[] = [];
    const CHUNK = 10;
    for (let i = 0; i < words.length; i += CHUNK) {
      const chunk = words.slice(i, i + CHUNK);
      if (chunk.length === 0) continue;
      segments.push({
        text: chunk.map((w) => w.word).join(" "),
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
      });
    }

    return {
      status: "completed",
      result: {
        text: transcript.text ?? "",
        segments,
        words,
        duration: transcript.audio_duration ?? 0,
      },
    };
  }

  return { status: transcript.status as "queued" | "processing" };
}
