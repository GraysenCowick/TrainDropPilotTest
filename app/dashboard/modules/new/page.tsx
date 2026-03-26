"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Video, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Tab = "text" | "video";

type UiStage =
  | "uploading"
  | "transcribing"
  | "error";

interface ProgressState {
  active: boolean;
  stage: UiStage;
  uploadProgress: number;
  errorMessage: string | null;
}

export default function NewModulePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    stage: "uploading",
    uploadProgress: 0,
    errorMessage: null,
  });

  function setError(message: string) {
    setProgress((p) => ({ ...p, stage: "error", errorMessage: message }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "text" && !rawNotes.trim()) { toast("Please add some notes first", "error"); return; }
    if (tab === "video" && !videoFile) { toast("Please select a video first", "error"); return; }

    setProgress({ active: true, stage: "uploading", uploadProgress: 0, errorMessage: null });

    try {
      if (tab === "video") await runVideoFlow();
      else await runTextFlow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function runTextFlow() {
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_type: "text",
        title: title.trim() || "Untitled SOP",
        description: description.trim() || null,
        raw_notes: rawNotes,
      }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create module"); }
    const data = await res.json();
    router.push(`/dashboard/modules/${data.id}`);
  }

  async function runVideoFlow() {
    if (!videoFile) throw new Error("Missing file");

    // Step 1: Get presigned upload URL
    setProgress({ active: true, stage: "uploading", uploadProgress: 0, errorMessage: null });

    const urlRes = await fetch("/api/upload-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: videoFile.name }),
    });
    if (!urlRes.ok) throw new Error("Failed to prepare upload");

    const { path: videoPath, token: videoToken, publicUrl: videoPublicUrl } = await urlRes.json();

    // Step 2: Upload video directly to Supabase
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("processed")
      .uploadToSignedUrl(videoPath, videoToken, videoFile, {
        contentType: videoFile.type || "video/mp4",
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    setProgress((p) => ({ ...p, uploadProgress: 100, stage: "transcribing" }));

    // Step 3: Create module (returns immediately — async processing starts)
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_type: "video",
        title: title.trim() || "Untitled Training Video",
        description: description.trim() || null,
        original_video_url: videoPublicUrl,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || "Failed to create module");
    }

    const data = await res.json();
    router.push(`/dashboard/modules/${data.id}`);
  }

  // ── Progress overlay ──────────────────────────────────────────────────────
  if (progress.active) {
    const isError = progress.stage === "error";

    const stageLabel: Partial<Record<UiStage, string>> = {
      uploading: tab === "video" ? "Uploading video..." : "Submitting your notes...",
      transcribing: "Upload complete! Creating your module...",
    };
    const label = stageLabel[progress.stage] ?? "Processing...";

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {tab === "video" ? "Uploading Video" : "Generating SOP"}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isError
              ? "Something went wrong."
              : tab === "video"
              ? "Hang tight while your video uploads. You'll be redirected to track progress."
              : "Claude is writing your SOP — just a moment…"}
          </p>
        </div>

        {isError ? (
          <div className="bg-surface border border-red-500/30 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Processing failed</p>
              <p className="text-xs text-text-secondary mt-1">{progress.errorMessage}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                setProgress({ active: false, stage: "uploading", uploadProgress: 0, errorMessage: null })
              }
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="bg-surface border border-[var(--color-border)] rounded-xl p-8 flex flex-col items-center gap-6">
            {/* Spinning wheel */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
              <div className="absolute inset-[6px] rounded-full bg-accent/10 flex items-center justify-center">
                <Loader2
                  className="h-5 w-5 text-accent animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                />
              </div>
            </div>

            {/* Label */}
            <p className="text-sm text-text-secondary text-center">{label}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">New Module</h1>
        <p className="text-sm text-text-secondary mt-1">
          Upload a video or paste your notes to generate a training module.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface border border-[var(--color-border)] rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab("video")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            tab === "video" ? "bg-accent text-background" : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Video className="h-4 w-4" />
          Upload Video
        </button>
        <button
          onClick={() => setTab("text")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            tab === "text" ? "bg-accent text-background" : "text-text-secondary hover:text-text-primary"
          )}
        >
          <FileText className="h-4 w-4" />
          Paste Notes
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tab === "text" ? "e.g. Opening Checklist" : "e.g. How to Prep Workstation"}
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what this training covers…"
          className="min-h-[80px]"
        />

        {tab === "text" ? (
          <Textarea
            label="Your Notes"
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Paste your bullet points, rough notes, or step-by-step instructions here. Don't worry about formatting — we'll clean it up."
            className="min-h-[300px]"
            required
          />
        ) : (
          <div>
            <p className="text-sm font-medium text-text-primary mb-1.5">Video File</p>
            <FileUpload onFileChange={setVideoFile} />
            <p className="text-xs text-text-secondary mt-2">
              MP4, MOV, or WebM · Up to 3 GB · Processing runs in the background
            </p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={(tab === "text" && !rawNotes.trim()) || (tab === "video" && !videoFile)}
        >
          {tab === "text" ? "Generate SOP" : "Process Video"}
        </Button>
      </form>
    </div>
  );
}
