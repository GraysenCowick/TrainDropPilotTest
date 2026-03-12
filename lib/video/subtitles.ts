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

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function generateSRT(words: WordTimestamp[]): string {
  if (words.length === 0) return "";

  const lines: string[] = [];
  let index = 1;
  let currentWords: WordTimestamp[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);

    // Break into a caption every 5 words, on sentence-ending punctuation, or at the last word
    const shouldBreak =
      currentWords.length >= 5 ||
      /[.!?]$/.test(word.word) ||
      i === words.length - 1;

    if (shouldBreak && currentWords.length > 0) {
      const startTime = currentWords[0].start;
      const endTime = currentWords[currentWords.length - 1].end;
      const text = currentWords.map((w) => w.word).join(" ").trim();

      lines.push(`${index}`);
      lines.push(`${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}`);
      lines.push(text);
      lines.push("");

      index++;
      currentWords = [];
    }
  }

  return lines.join("\n");
}

/**
 * Generate VTT from segment-level timestamps (one caption per segment/sentence).
 * Used as fallback when word-level timestamps are unavailable or incomplete.
 */
function generateVTTFromSegments(segments: SegmentTimestamp[]): string {
  const lines: string[] = ["WEBVTT", ""];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const text = seg.text.trim();
    if (!text) continue;

    lines.push(`${i + 1}`);
    lines.push(`${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}`);
    lines.push(text);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate a WebVTT subtitle file.
 *
 * Prefers word-level timestamps (fine-grained, 5 words per cue) when Whisper
 * returns them. Falls back to segment-level timestamps (one cue per sentence)
 * when the words array is empty — Whisper occasionally omits word timestamps
 * for longer or unclear audio, but always returns segments.
 */
export function generateVTT(
  words: WordTimestamp[],
  segments?: SegmentTimestamp[]
): string {
  if (words.length > 0) {
    const srt = generateSRT(words);
    return "WEBVTT\n\n" + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  }

  if (segments && segments.length > 0) {
    return generateVTTFromSegments(segments);
  }

  return "WEBVTT\n\n";
}
