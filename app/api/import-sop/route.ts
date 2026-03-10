import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateSOP } from "@/lib/ai/claude";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";

  const isPDF =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isDOCX =
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx");

  if (isPDF) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    extractedText = result.text;
  } else if (isDOCX) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } else {
    return NextResponse.json({ error: "Unsupported file type. Use PDF or DOCX." }, { status: 400 });
  }

  if (!extractedText.trim()) {
    return NextResponse.json(
      { error: "No text could be extracted. The file may be scanned or image-based." },
      { status: 422 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  // Create module row
  const { data: module, error: insertError } = await admin
    .from("modules")
    .insert({
      user_id: user.id,
      title: "Processing...",
      status: "processing",
      input_type: "text",
      raw_notes: extractedText,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Generate SOP synchronously (same as text module flow)
  try {
    const result = await generateSOP(extractedText);
    await admin
      .from("modules")
      .update({
        title: result.title,
        sop_content: result.sop_content,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", module.id);
  } catch {
    await admin
      .from("modules")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("id", module.id);
    return NextResponse.json({ error: "SOP generation failed" }, { status: 500 });
  }

  return NextResponse.json({ id: module.id }, { status: 201 });
}
