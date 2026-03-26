import { AssemblyAI } from "assemblyai";

function getClient() {
  return new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });
}

export interface AAIWord {
  text: string;
  start: number; // milliseconds
  end: number;
}

export interface AAIChapter {
  headline: string;
  summary: string;
  start: number; // ms
  end: number;
}

export interface AAITranscriptResult {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  words: AAIWord[] | null;
  chapters: AAIChapter[] | null;
  error?: string | null;
}

export async function submitTranscription(audioUrl: string): Promise<string> {
  const client = getClient();
  const job = await client.transcripts.submit({
    audio_url: audioUrl,
    auto_chapters: true,
  });
  return job.id;
}

export async function getTranscriptionStatus(jobId: string): Promise<AAITranscriptResult> {
  const client = getClient();
  const result = await client.transcripts.get(jobId);
  return {
    id: result.id,
    status: result.status as AAITranscriptResult["status"],
    text: result.text ?? null,
    words: result.words
      ? result.words.map((w) => ({ text: w.text ?? "", start: w.start ?? 0, end: w.end ?? 0 }))
      : null,
    chapters: result.chapters
      ? result.chapters.map((c) => ({
          headline: c.headline ?? "",
          summary: c.summary ?? "",
          start: c.start ?? 0,
          end: c.end ?? 0,
        }))
      : null,
    error: result.error ?? null,
  };
}
