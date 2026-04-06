import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface QuizQuestion {
  chapter_index: number; // -1 = final test
  question: string;
  options: string[]; // exactly 4 options
  correct_answer: number; // 0-3 index
  explanation: string;
  sort_order: number;
}

export async function generateQuizQuestions(
  transcript: string,
  chapters: Array<{ title: string; start_time: number; summary: string }>
): Promise<QuizQuestion[]> {
  const chapterList = chapters
    .map((c, i) => `Chapter ${i}: "${c.title}"\nSummary: ${c.summary}`)
    .join("\n\n");

  // Trim transcript if very long (stay well within context limits)
  const trimmedTranscript =
    transcript.length > 40000
      ? transcript.slice(0, 40000) + "\n\n[transcript continues — additional content not shown]"
      : transcript;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are creating training assessment questions for a business training video.

CHAPTERS IN THIS TRAINING:
${chapterList}

TRANSCRIPT:
${trimmedTranscript}

INSTRUCTIONS:
- Write 2-3 questions per chapter (chapter_index = 0, 1, 2...)
- Write 5 questions for the final test (chapter_index = -1)
- Each question has exactly 4 answer choices
- Questions should test practical understanding and application — not trivial recall
- Questions should be moderately challenging: not too obvious, not obscure
- Explanations reinforce WHY the correct answer is right
- Write questions as if you are a manager testing whether an employee actually learned the material

Return ONLY valid JSON (no markdown, no preamble):
{
  "questions": [
    {
      "chapter_index": 0,
      "question": "When performing [specific task from the video], what is the correct first step?",
      "options": ["A. Option text", "B. Option text", "C. Option text", "D. Option text"],
      "correct_answer": 0,
      "explanation": "The correct answer is A because...",
      "sort_order": 0
    }
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in quiz generation response");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed.questions)) throw new Error("Invalid quiz response structure");

  return parsed.questions as QuizQuestion[];
}
