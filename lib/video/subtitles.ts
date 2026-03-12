interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface SegmentTimestamp {
  text: string;
  start: number;
  end: number;
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

/**
 * Build flowing VTT cues from word-level timestamps.
 *
 * Groups words into small chunks (up to 4 words) so captions change in sync
 * with the speaker rather than showing a full sentence all at once.
 *
 * End time of each cue = start time of the next cue, creating seamless
 * transitions with no gap between captions. Breaking on sentence-ending
 * punctuation keeps captions aligned with natural speech pauses.
 */
function cuesFromWords(words: WordTimestamp[]): string {
  if (words.length === 0) return "WEBVTT\n\n";

  // Build chunks of up to 4 words, breaking on sentence-ending punctuation
  const chunks: Array<{ words: WordTimestamp[] }> = [];
  let current: WordTimestamp[] = [];

  for (let i = 0; i < words.length; i++) {
    current.push(words[i]);
    const atSentenceEnd = /[.!?]$/.test(words[i].word);
    const chunkFull = current.length >= 4;

    if (chunkFull || atSentenceEnd || i === words.length - 1) {
      chunks.push({ words: current });
      current = [];
    }
  }

  const lines: string[] = ["WEBVTT", ""];
  let idx = 1;

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    const text = chunk.words.map((w) => w.word).join(" ").trim();
    if (!text) continue;

    const startTime = chunk.words[0].start;
    // End at the next chunk's start for seamless flow; last chunk ends at its
    // own final word's end time
    const endTime =
      c < chunks.length - 1
        ? chunks[c + 1].words[0].start
        : chunk.words[chunk.words.length - 1].end;

    lines.push(`${idx++}`);
    lines.push(`${formatVTTTime(startTime)} --> ${formatVTTTime(endTime)}`);
    lines.push(text);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Build VTT cues from segment-level timestamps (fallback).
 * One caption per sentence. Less dynamic but always available.
 */
function cuesFromSegments(segments: SegmentTimestamp[]): string {
  const lines: string[] = ["WEBVTT", ""];
  let idx = 1;

  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;

    const wordList = text.split(/\s+/);

    if (wordList.length <= 10) {
      lines.push(`${idx++}`);
      lines.push(`${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}`);
      lines.push(text);
      lines.push("");
    } else {
      // Split long segment into two halves
      const mid = Math.floor(wordList.length / 2);
      const midTime = seg.start + (seg.end - seg.start) * (mid / wordList.length);

      lines.push(`${idx++}`);
      lines.push(`${formatVTTTime(seg.start)} --> ${formatVTTTime(midTime)}`);
      lines.push(wordList.slice(0, mid).join(" "));
      lines.push("");

      lines.push(`${idx++}`);
      lines.push(`${formatVTTTime(midTime)} --> ${formatVTTTime(seg.end)}`);
      lines.push(wordList.slice(mid).join(" "));
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generate a WebVTT caption file from Whisper output.
 *
 * Word-level timestamps are used when available — they produce flowing captions
 * that change every 4 words in sync with the speaker. Segment-level timestamps
 * are the fallback for cases where Whisper did not return word data.
 */
export function generateVTT(
  words: WordTimestamp[],
  segments?: SegmentTimestamp[]
): string {
  if (words && words.length > 0) {
    return cuesFromWords(words);
  }
  if (segments && segments.length > 0) {
    return cuesFromSegments(segments);
  }
  return "WEBVTT\n\n";
}
