"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Video, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { VideoProcessingStep } from "@/lib/supabase/types";

type Tab = "text" | "video";

// Visible pipeline stages shown in the progress UI
type UiStage =
  | "uploading"
  | "transcribing"
  | "analyzing"
  | "finalizing"
  | "error";

interface ProgressState {
  active: boolean;
  stage: UiStage;
  uploadProgress: number;
  moduleId: string | null;
  errorMessage: string | null;
}


// Map processing_step DB value → UI stage
function dbStepToUiStage(step: VideoProcessingStep): UiStage {
  if (step === "transcribing") return "transcribing";
  if (step === "analyzing" || step === "voiceover" || step === "processing_video") return "analyzing";
  if (step === "finalizing") return "finalizing";
  return "transcribing"; // null = just queued, show earliest active stage
}

const STAGE_ORDER: UiStage[] = ["uploading", "transcribing", "analyzing", "finalizing", "error"];

function stageIndex(s: UiStage) {
  return STAGE_ORDER.indexOf(s);
}

export default function NewModulePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("video");
  const [title, setTitle] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    stage: "uploading",
    uploadProgress: 0,
    moduleId: null,
    errorMessage: null,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function setError(message: string) {
    stopPolling();
    setProgress((p) => ({ ...p, stage: "error", errorMessage: message }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (tab === "text" && !rawNotes.trim()) {
      toast("Please add some notes first", "error");
      return;
    }
    if (tab === "video" && !videoFile) {
      toast("Please select a video first", "error");
      return;
    }

    setProgress({
      active: true,
      stage: tab === "video" ? "uploading" : "analyzing",
      uploadProgress: 0,
      moduleId: null,
      errorMessage: null,
    });

    try {
      if (tab === "video") {
        await runVideoFlow();
      } else {
        await runTextFlow();
      }
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
        raw_notes: rawNotes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create module");
    }

    const data = await res.json();
    setProgress((p) => ({ ...p, stage: "finalizing" }));
    await new Promise((resolve) => setTimeout(resolve, 600));
    router.push(`/dashboard/modules/${data.id}`);
  }

  async function runVideoFlow() {
    if (!videoFile) throw new Error("Missing file");

    // ── Step 1: Compress & upload via server ─────────────────────────────────
    // Server-side ffmpeg compresses to 720p H.264 before storing in Supabase,
    // keeping files well under the 50MB storage limit.
    const formData = new FormData();
    formData.append("video", videoFile);

    const uploadRes = await fetch("/api/upload-video", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.error || "Upload failed");
    }

    const { signedUrl } = await uploadRes.json();
    setProgress((p) => ({ ...p, uploadProgress: 100 }));

    // ── Step 2: Create module row + fire Inngest ─────────────────────────────
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_type: "video",
        title: title.trim() || "Untitled Training Video",
        original_video_url: signedUrl,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create module");
    }

    const data = await res.json();
    const moduleId: string = data.id;

    setProgress((p) => ({ ...p, stage: "transcribing", moduleId }));

    // ── Step 3: Poll until done ──────────────────────────────────────────────
    pollRef.current = setInterval(async () => {
      try {
        const pollRes = await fetch(`/api/modules/${moduleId}`);
        if (!pollRes.ok) return;

        const mod = await pollRes.json();
        const status: string = mod.status;
        const processingStep: VideoProcessingStep = mod.processing_step ?? null;

        if (status === "error") {
          setError("Video processing failed. Please try again.");
          return;
        }

        if (status === "ready" || status === "published") {
          stopPolling();
          setProgress((p) => ({ ...p, stage: "finalizing" }));
          await new Promise((resolve) => setTimeout(resolve, 600));
          router.push(`/dashboard/modules/${moduleId}`);
          return;
        }

        // Map DB step to UI stage and advance if forward progress
        const newStage = dbStepToUiStage(processingStep);
        setProgress((p) => {
          if (stageIndex(newStage) > stageIndex(p.stage)) {
            return { ...p, stage: newStage };
          }
          return p;
        });
      } catch {
        // Ignore transient poll errors
      }
    }, 2500);
  }

  // ── Progress overlay ───────────────────────────────────────────────────────
  if (progress.active) {
    const isError = progress.stage === "error";

    const uploadPct = Math.round(progress.uploadProgress * 0.3);
    const stagePercent: Partial<Record<UiStage, number>> = {
      uploading: uploadPct,
      transcribing: 40,
      analyzing: 70,
      finalizing: 90,
    };
    const stageLabel: Partial<Record<UiStage, string>> = {
      uploading: "Compressing & uploading video...",
      transcribing: "Transcribing audio...",
      analyzing: tab === "video" ? "Generating training module..." : "Generating SOP...",
      finalizing: "Finalizing...",
    };
    const percent = stagePercent[progress.stage] ?? 0;
    const label = stageLabel[progress.stage] ?? "Processing...";

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {tab === "video" ? "Processing Video" : "Generating SOP"}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isError
              ? "Something went wrong during processing."
              : tab === "video"
              ? "This takes 2–5 minutes. You can safely navigate away and come back."
              : "Claude is writing your SOP. Just a moment…"}
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
                setProgress({
                  active: false,
                  stage: "uploading",
                  uploadProgress: 0,
                  moduleId: null,
                  errorMessage: null,
                })
              }
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="bg-surface border border-[var(--color-border)] rounded-xl p-8">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-in-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-sm text-text-secondary text-center">{label}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
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
            tab === "video"
              ? "bg-accent text-background"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Video className="h-4 w-4" />
          Upload Video
        </button>
        <button
          onClick={() => setTab("text")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            tab === "text"
              ? "bg-accent text-background"
              : "text-text-secondary hover:text-text-primary"
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
          placeholder={
            tab === "text" ? "e.g. Opening Checklist" : "e.g. How to Prep Workstation"
          }
        />

        {tab === "text" ? (
          <Textarea
            label="Raw Notes"
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
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={
            (tab === "text" && !rawNotes.trim()) ||
            (tab === "video" && !videoFile)
          }
        >
          {tab === "text" ? "Generate SOP" : "Process Video"}
        </Button>
      </form>

      <p className="text-xs text-text-secondary text-center mt-4">
        {tab === "text"
          ? "Your structured SOP will be ready in 15–30 seconds."
          : "Video processing takes 2–5 minutes. You can leave this page."}
      </p>
    </div>
  );
}
