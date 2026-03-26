const BASE_URL = "https://api.assemblyai.com/v2";

function authHeaders() {
  return {
    authorization: process.env.ASSEMBLYAI_API_KEY!,
    "content-type": "application/json",
  };
}

export interface AAIWord {
  text: string;
  start: number; // milliseconds
  end: number;
}

export interface AAITranscriptResult {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  words: AAIWord[] | null;
  error?: string | null;
}

/**
 * Submit a video/audio URL to AssemblyAI for transcription.
 * Returns the job ID immediately — does not wait for completion.
 * NOTE: auto_chapters is intentionally omitted — Claude generates chapters instead.
 */
export async function submitTranscription(audioUrl: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/transcript`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ audio_url: audioUrl }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AssemblyAI submit failed (HTTP ${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.id) throw new Error("AssemblyAI submit returned no job ID");
  return data.id as string;
}

/**
 * Check the status of an AssemblyAI transcription job.
 */
export async function getTranscriptionStatus(jobId: string): Promise<AAITranscriptResult> {
  const res = await fetch(`${BASE_URL}/transcript/${jobId}`, {
    headers: { authorization: process.env.ASSEMBLYAI_API_KEY! },
  });

  if (!res.ok) {
    throw new Error(`AssemblyAI status check failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    id: data.id,
    status: data.status as AAITranscriptResult["status"],
    text: data.text ?? null,
    words: data.words
      ? (data.words as Array<{ text: string; start: number; end: number }>).map((w) => ({
          text: w.text,
          start: w.start,
          end: w.end,
        }))
      : null,
    error: data.error ?? null,
  };
}
