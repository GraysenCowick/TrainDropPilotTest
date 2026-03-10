interface WordTimestamp {
  word: string;
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

export function generateSRT(words: WordTimestamp[]): string {
  if (words.length === 0) return "";

  const lines: string[] = [];
  let index = 1;
  let currentWords: WordTimestamp[] = [];

  for (const word of words) {
    currentWords.push(word);

    // Group into ~5-word chunks or when we hit punctuation
    const shouldBreak =
      currentWords.length >= 5 ||
      word.word.match(/[.!?,]$/) ||
      words.indexOf(word) === words.length - 1;

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

export function generateVTT(words: WordTimestamp[]): string {
  const srt = generateSRT(words);
  // Convert SRT to VTT
  return "WEBVTT\n\n" + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
}
