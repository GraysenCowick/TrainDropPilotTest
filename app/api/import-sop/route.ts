import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Only needs to download + parse the file, not run Claude — keep this fast.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { file_url, filename } = body as { file_url?: string; filename?: string };
  if (!file_url || !filename) {
    return NextResponse.json({ error: "file_url and filename are required" }, { status: 400 });
  }

  const fileRes = await fetch(file_url);
  if (!fileRes.ok) {
    return NextResponse.json({ error: "Failed to fetch document from storage" }, { status: 502 });
  }
  const buffer = Buffer.from(await fileRes.arrayBuffer());
  let extractedText = "";

  const lowerName = filename.toLowerCase();
  const isPDF = lowerName.endsWith(".pdf");
  const isDOCX = lowerName.endsWith(".docx");

  try {
    if (isPDF) {
      // pdf-parse v1.1.1 — pure-JS, bundles pdfjs-dist v2, no native deps.
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const pdfParse = require("pdf-parse") as any;
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (isDOCX) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use PDF or DOCX." }, { status: 400 });
    }
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error("[import-sop] extraction failed:", msg);
    return NextResponse.json(
      { error: "Could not read this file. It may be encrypted, password-protected, or image-based." },
      { status: 422 }
    );
  }

  // Strip null bytes — PostgreSQL rejects text with embedded \x00 characters.
  extractedText = extractedText.replace(/\x00/g, "").trim();

  if (!extractedText) {
    return NextResponse.json(
      { error: "No text could be extracted. The file may be scanned or image-based." },
      { status: 422 }
    );
  }

  // Claude's context window is ~200K tokens (~800K chars). Truncate to be safe.
  const MAX_CHARS = 600_000;
  if (extractedText.length > MAX_CHARS) {
    console.warn(`[import-sop] Truncating extracted text from ${extractedText.length} to ${MAX_CHARS} chars`);
    extractedText = extractedText.slice(0, MAX_CHARS);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  // Store raw_notes and return { id } immediately.
  // SOP generation (Claude) runs asynchronously via /api/modules/[id]/status
  // when the client polls — same pattern as video transcription.
  const { data: module, error: insertError } = await admin
    .from("modules")
    .insert({
      user_id: user.id,
      title: filename.replace(/\.[^.]+$/, ""),
      status: "processing",
      processing_step: "pending-analysis",
      input_type: "text",
      raw_notes: extractedText,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ id: module.id }, { status: 201 });
}
