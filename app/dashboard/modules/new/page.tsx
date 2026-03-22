"use client";

import { useState, useEffect, useRef } from "react";
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
  | "analyzing"
  | "finalizing"
  | "error";

interface ProgressState {
  active: boolean;
  stage: UiStage;
  uploadProgress: number;
  errorMessage: string | null;
}

// ── Audio extraction (runs entirely in the browser) ───────────────────────────
// Extracts the audio track and re-encodes as 16 kHz mono WAV.
// This keeps the file tiny (~1 MB/min) so Whisper's 25 MB limit is never hit.

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numSamples = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const dataLen = numSamples * 2;
  const buf = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buf);
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, "data");
  view.setUint32(40, dataLen, true);
  const pcm = audioBuffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s * 0x7fff, true);
    offset += 2;
  }
  return buf;
}

async function extractAudioFromVideo(file: File): Promise<File> {
  // Fast path (Chrome/Firefox): decodeAudioData works for MP4/AAC containers.
  // Skip for MOV/QuickTime — the Web Audio API does not support that container
  // even though the <video> element can play it via OS codecs.
  const isMov = file.name.toLowerCase().endsWith(".mov") || file.type === "video/quicktime";
  if (!isMov) try {
    const arrayBuffer = await file.arrayBuffer();
    const tmpCtx = new AudioContext();
    const raw = await tmpCtx.decodeAudioData(arrayBuffer.slice(0));
    await tmpCtx.close();

    const TARGET_RATE = 16_000;
    const offCtx = new OfflineAudioContext(1, Math.ceil(raw.duration * TARGET_RATE), TARGET_RATE);
    const src = offCtx.createBufferSource();
    src.buffer = raw;
    src.connect(offCtx.destination);
    src.start(0);
    const resampled = await offCtx.startRendering();
    return new File([encodeWav(resampled)], "audio.wav", { type: "audio/wav" });
  } catch {
    // fall through to video-element fallback
  }

  // Fallback (Safari + MOV + any format the browser can play).
  // Records audio in real-time while a hidden video plays.
  // Audio is intercepted by AudioContext (createMediaElementSource), routed to
  // the MediaRecorder via MediaStreamDestination, and silenced to speakers via
  // a GainNode at 0. Do NOT set video.muted — that also mutes the AudioContext.
  return new Promise<File>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
    document.body.appendChild(video);
    video.src = url;
    video.preload = "auto";

    const cleanup = () => {
      try { document.body.removeChild(video); } catch { /* already removed */ }
      URL.revokeObjectURL(url);
    };

    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("Browser cannot decode this video format"));
    });

    video.addEventListener("loadedmetadata", () => {
      const audioCtx = new AudioContext({ sampleRate: 16_000 });
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();

      // Route audio to the recorder
      source.connect(dest);

      // Route through a gain=0 node to destination: keeps the AudioContext
      // running without producing audible output
      const silencer = audioCtx.createGain();
      silencer.gain.value = 0;
      source.connect(silencer);
      silencer.connect(audioCtx.destination);

      let mimeType = "";
      for (const m of ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]) {
        if (MediaRecorder.isTypeSupported(m)) { mimeType = m; break; }
      }

      const recorder = mimeType
        ? new MediaRecorder(dest.stream, { mimeType })
        : new MediaRecorder(dest.stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        cleanup();
        audioCtx.close();
        const type = recorder.mimeType;
        const ext = type.includes("mp4") ? "m4a" : "webm";
        resolve(new File(chunks, `audio.${ext}`, { type }));
      };

      recorder.start();
      video.play()
        .then(() => { video.addEventListener("ended", () => recorder.stop()); })
        .catch((err) => { cleanup(); reject(err); });
    });
  });
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
    errorMessage: null,
  });

  // Stage animation timer (advances label while server processes)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function setError(message: string) {
    stopTimer();
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
        raw_notes: rawNotes,
      }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create module"); }
    const data = await res.json();
    router.push(`/dashboard/modules/${data.id}`);
  }

  async function runVideoFlow() {
    if (!videoFile) throw new Error("Missing file");
    if (videoFile.size > 500 * 1024 * 1024) {
      throw new Error(`File too large (${(videoFile.size / 1024 / 1024).toFixed(0)} MB). Max 500 MB.`);
    }

    // ── Step 1: Extract audio ─────────────────────────────────────────────
    setProgress((p) => ({ ...p, uploadProgress: 15 }));
    let audioFile: File;
    try {
      audioFile = await extractAudioFromVideo(videoFile);
    } catch {
      throw new Error("Could not read audio from this video. Please try a different file format.");
    }
    setProgress((p) => ({ ...p, uploadProgress: 55 }));

    // ── Step 2: Get presigned upload URLs ─────────────────────────────────
    const [videoUrlRes, audioUrlRes] = await Promise.all([
      fetch("/api/upload-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: videoFile.name }),
      }),
      fetch("/api/upload-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: audioFile.name }),
      }),
    ]);
    if (!videoUrlRes.ok || !audioUrlRes.ok) throw new Error("Failed to prepare upload");

    const { path: videoPath, token: videoToken, publicUrl: videoPublicUrl } = await videoUrlRes.json();
    const { path: audioPath, token: audioToken, publicUrl: audioPublicUrl } = await audioUrlRes.json();

    // ── Step 3: Upload both files to Supabase ─────────────────────────────
    const supabase = createClient();
    const [videoUpload, audioUpload] = await Promise.all([
      supabase.storage.from("processed").uploadToSignedUrl(videoPath, videoToken, videoFile, {
        contentType: videoFile.type || "video/mp4",
      }),
      supabase.storage.from("processed").uploadToSignedUrl(audioPath, audioToken, audioFile, {
        contentType: audioFile.type || "audio/wav",
      }),
    ]);
    if (videoUpload.error) throw new Error(`Video upload failed: ${videoUpload.error.message}`);
    if (audioUpload.error) throw new Error(`Audio upload failed: ${audioUpload.error.message}`);

    setProgress((p) => ({ ...p, uploadProgress: 100 }));

    // ── Step 4: Animate stages while server runs Whisper + Claude ─────────
    // The POST below is synchronous on the server (~30–90s).
    // Advance the stage label every 25s so the user sees progress.
    setProgress((p) => ({ ...p, stage: "transcribing" }));
    const stageSequence: UiStage[] = ["transcribing", "analyzing", "finalizing"];
    let seq = 0;
    timerRef.current = setInterval(() => {
      seq = Math.min(seq + 1, stageSequence.length - 1);
      setProgress((p) => ({ ...p, stage: stageSequence[seq] }));
    }, 25_000);

    // ── Step 5: POST — server runs full pipeline, blocks until done ───────
    let moduleId: string;
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_type: "video",
          title: title.trim() || "Untitled Training Video",
          original_video_url: videoPublicUrl,
          audio_url: audioPublicUrl,
        }),
      });

      stopTimer();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create module");
      }

      const data = await res.json();
      moduleId = data.id;
    } catch (err) {
      stopTimer();
      throw err;
    }

    setProgress((p) => ({ ...p, stage: "finalizing" }));
    await new Promise((r) => setTimeout(r, 500));
    router.push(`/dashboard/modules/${moduleId}`);
  }

  // ── Progress overlay ──────────────────────────────────────────────────────
  if (progress.active) {
    const isError = progress.stage === "error";

    const uploadPct = Math.round(progress.uploadProgress * 0.3);
    const stagePercent: Partial<Record<UiStage, number>> = {
      uploading: tab === "text" ? 30 : uploadPct,
      transcribing: 40,
      analyzing: 70,
      finalizing: 90,
    };
    const stageLabel: Partial<Record<UiStage, string>> = {
      uploading: tab === "video" ? "Extracting audio & uploading video..." : "Submitting your notes...",
      transcribing: "Transcribing audio with Whisper...",
      analyzing: "Generating SOP with Claude...",
      finalizing: "Wrapping up...",
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
              ? "Something went wrong."
              : tab === "video"
              ? "This takes 1–3 minutes. Please keep this tab open."
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

            {/* Progress bar + label */}
            <div className="w-full">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700 ease-in-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary text-center">{label}</p>
            </div>
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
              MP4, MOV, or WebM · Max 500 MB · Keep this tab open while processing
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
