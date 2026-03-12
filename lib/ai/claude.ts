import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SOPResult {
  title: string;
  sop_content: string;
}

export interface TranscriptAnalysisResult {
  title: string;
  cleaned_transcript: string;
  sop_content: string;
  chapters: Array<{
    title: string;
    start_time: number;
    summary: string;
  }>;
}

export async function generateSOP(rawNotes: string): Promise<SOPResult> {
  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a professional SOP (Standard Operating Procedure) writer for small businesses.

Convert these raw notes into a professional, structured SOP. The SOP should be clear, step-by-step, and easy for any employee to follow.

Return your response as JSON with this exact structure:
{
  "title": "Short, descriptive title for this SOP (max 60 chars)",
  "sop_content": "Full markdown-formatted SOP content here"
}

The SOP should include:
- A brief overview/purpose statement
- Step-by-step numbered instructions
- Any important warnings or tips (use ⚠️ for warnings, 💡 for tips)
- Clear, actionable language

Do NOT include any unfilled template placeholders like [Date], [Manager Name], [Your Name], or any bracketed variables. Only include real content.

Raw notes:
${rawNotes}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}

export async function analyzeTranscript(
  transcript: string
): Promise<TranscriptAnalysisResult> {
  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are converting a training video transcript into a Standard Operating Procedure (SOP) document.

The transcript below is a direct recording of someone explaining or demonstrating a real process. Your job is to turn their words into a clean, structured SOP that employees can follow.

CRITICAL RULES — read carefully before writing:
1. The SOP must be based ONLY on what the speaker actually said in the transcript. Do not add steps, advice, or content that isn't in the transcript.
2. Preserve the speaker's exact terminology, names, product names, and specific details (temperatures, times, quantities, tool names, etc.).
3. If the speaker lists steps in a specific order, keep that exact order.
4. Do not pad with generic business advice. Every sentence in the SOP should trace back to something said in the video.
5. Do NOT use placeholder text like [Date], [Name], [Your Company], or any bracketed variables.
6. Write in second-person imperative ("Place the tray...", "Turn on the machine...", not "The employee should...").

Return ONLY valid JSON with this structure (no text before or after the JSON):
{
  "title": "Specific title describing exactly what this training covers (max 60 chars)",
  "cleaned_transcript": "The full transcript cleaned up — fix run-on sentences, add punctuation, break into paragraphs. Keep all original content and wording.",
  "sop_content": "Detailed markdown SOP. Use ## for section headings, numbered lists for sequential steps, bullet points for non-sequential items. Include every specific detail from the video: exact steps, settings, quantities, warnings, tips. This should be comprehensive enough that someone can follow it without watching the video.",
  "chapters": [
    {"title": "Section name", "start_time": 0, "summary": "One sentence describing what is covered in this section"}
  ]
}

Transcript:
${transcript}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}
