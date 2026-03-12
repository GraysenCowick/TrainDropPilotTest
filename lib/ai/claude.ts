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
        content: `You are an expert at analyzing training video transcripts and creating structured SOPs for small businesses.

Analyze this video transcript and return a JSON response with this exact structure:
{
  "title": "Short, descriptive title for this training (max 60 chars)",
  "cleaned_transcript": "Cleaned, readable version of the transcript with proper punctuation and paragraphs",
  "sop_content": "Full markdown-formatted SOP based on the training content",
  "chapters": [
    {"title": "Chapter title", "start_time": 0, "summary": "What this section covers"}
  ]
}

Do NOT include any unfilled template placeholders like [Date], [Manager Name], [Your Name], or any bracketed variables. Only include real content.

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
