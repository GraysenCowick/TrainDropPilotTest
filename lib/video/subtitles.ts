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
 * Build VTT cues from Whisper segments.
 *
 * Segments are sentence-level — Whisper's segment timestamps are reliable and
 * well-calibrated. Word-level timestamps drift and cause sync issues, so we
 * use segments as the primary source.
 *
 * Long segments (> 10 words) are split into two equal cues so no single caption
 * holds too much text. The split point is timed proportionally.
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
      // Split long segment into two halves, dividing time proportionally
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
 * Build VTT cues from word-level timestamps (fallback only).
 * Groups words into ~6-word chunks. Less accurate than segments.
 */
function cuesFromWords(words: WordTimestamp[]): string {
  if (words.length === 0) return "WEBVTT\n\n";

  const lines: string[] = ["WEBVTT", ""];
  let idx = 1;
  let chunk: WordTimestamp[] = [];

  for (let i = 0; i < words.length; i++) {
    chunk.push(words[i]);
    if (chunk.length >= 6 || /[.!?]$/.test(words[i].word) || i === words.length - 1) {
      lines.push(`${idx++}`);
      lines.push(`${formatVTTTime(chunk[0].start)} --> ${formatVTTTime(chunk[chunk.length - 1].end)}`);
      lines.push(chunk.map((w) => w.word).join(" ").trim());
      lines.push("");
      chunk = [];
    }
  }

  return lines.join("\n");
}

/**
 * Generate a WebVTT caption file from Whisper output.
 *
 * Segment timestamps are used as primary — they are sentence-level and
 * accurately reflect when each sentence is spoken. Word timestamps are
 * kept as a fallback for edge cases where segments are missing.
 */
export function generateVTT(
  words: WordTimestamp[],
  segments?: SegmentTimestamp[]
): string {
  if (segments && segments.length > 0) {
    return cuesFromSegments(segments);
  }
  return cuesFromWords(words);
}
