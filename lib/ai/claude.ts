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
        content: `You are a professional training document writer for small businesses. Turn these raw notes into a polished, comprehensive Standard Operating Procedure (SOP) that a new employee can follow without needing additional guidance.

The SOP must look and read like a real company training document — thorough, well-organized, and professional.

WRITING RULES:
- Write in clear second-person imperative: "Open the register...", "Check that...", "Place the..."
- Expand brief notes into complete, actionable instructions with enough detail to actually follow
- Organize steps logically — group related actions under section headings
- Do NOT use placeholder text like [Date], [Manager Name], [Your Name], or bracketed variables

THE sop_content MUST FOLLOW THIS STRUCTURE:

## Overview
What this procedure covers and why it matters.

## Materials & Equipment
Everything needed before starting (if applicable).

## Step-by-Step Instructions
Numbered steps under ### sub-headings for each phase. Break compound steps into individual numbered steps.

## Key Reminders
Most important things to remember, warnings, and common mistakes to avoid.

## Summary
Brief paragraph on the expected outcome when the procedure is completed correctly.

Return ONLY valid JSON with no text before or after it:
{
  "title": "Clear, specific title (max 60 chars)",
  "sop_content": "Complete professional SOP in markdown following the structure above"
}

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

export async function refineSOP(currentSOP: string, instruction: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are editing an existing Standard Operating Procedure (SOP). Apply the requested changes while preserving the overall structure, markdown formatting, and all content that was not mentioned.

RULES:
- Only change what is explicitly requested
- Preserve all markdown formatting (##, ###, bullet points, numbered lists)
- Keep the same professional tone and writing style
- Do NOT add commentary or explanation — return only the updated SOP markdown

Current SOP:
${currentSOP}

Requested changes:
${instruction}

Return ONLY the updated SOP in markdown. No JSON, no preamble, just the markdown.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text.trim();
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
        content: `You are a professional training document writer. A business owner has recorded a training video and you must turn the transcript into a polished, comprehensive Standard Operating Procedure (SOP) that a new employee can use to learn and perform this task correctly.

Your output must look and read like a real company training document — thorough, organized, and professional. A new employee should be able to read the SOP alone and know exactly what to do.

WRITING RULES:
- Use the transcript as your primary source. Every procedure and step must come from or be directly inferred from what was said in the video.
- Preserve all specific details exactly as mentioned: product names, quantities, temperatures, equipment names, timing, settings, order of steps.
- Write in clear second-person imperative voice: "Pour the solution into...", "Turn the dial to...", "Check that..."
- Do NOT use placeholder text like [Date], [Manager Name], or any bracketed variables — only real content.
- Expand the speaker's words into complete, professional instructions. If they say "make sure it's clean," write a clear instruction for how to verify cleanliness.
- Organize content logically even if the speaker jumped around.

THE sop_content MUST FOLLOW THIS STRUCTURE (use these exact ## headings where applicable):

## Overview
One to two sentences describing what this procedure covers and why it matters.

## Who This Applies To
Who should follow this procedure (e.g., all front-of-house staff, new kitchen employees, etc. — infer from context).

## Materials & Equipment
Bulleted list of everything needed (tools, ingredients, supplies, equipment mentioned in the video).

## Step-by-Step Instructions
Numbered steps organized under ### sub-headings for each phase or section of the process. Be thorough — break compound steps into individual numbered steps. Include every detail mentioned.

## Key Reminders
Bulleted list of the most important things to remember, warnings, or common mistakes to avoid based on what the speaker emphasized.

## Summary
One short paragraph summarizing the procedure and the expected outcome when done correctly.

Return ONLY valid JSON with no text before or after it:
{
  "title": "Clear, specific title for this training procedure (max 60 chars)",
  "cleaned_transcript": "Full transcript with proper punctuation, capitalization, and paragraph breaks. Keep all original words and content — just clean up the formatting.",
  "sop_content": "The complete professional SOP document following the structure above, written in markdown.",
  "chapters": [
    {"title": "Chapter name", "start_time": 0, "summary": "One sentence on what this section covers"}
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
