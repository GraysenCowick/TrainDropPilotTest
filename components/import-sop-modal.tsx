"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  FileText,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isAcceptedVideo, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type FileType = "pdf" | "docx" | "video";
type ItemStatus = "queued" | "processing" | "done" | "error";

interface ImportItem {
  id: string;
  file: File;
  fileType: FileType;
  status: ItemStatus;
  error?: string;
  moduleId?: string;
}

function getFileType(file: File): FileType | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  )
    return "docx";
  if (isAcceptedVideo(file)) return "video";
  return null;
}

function TypeBadge({ type }: { type: FileType }) {
  const styles: Record<FileType, string> = {
    pdf: "bg-red-500/10 text-red-400 border-red-500/20",
    docx: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    video: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  const labels: Record<FileType, string> = { pdf: "PDF", docx: "DOCX", video: "Video" };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border shrink-0", styles[type])}>
      {labels[type]}
    </span>
  );
}

interface ImportSOPModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportSOPModal({ open, onClose }: ImportSOPModalProps) {
  const router = useRouter();
  const [items, setItems] = useState<ImportItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: ImportItem[] = [];
    for (const file of Array.from(files)) {
      const fileType = getFileType(file);
      if (!fileType) continue;
      newItems.push({ id: Math.random().toString(36).slice(2), file, fileType, status: "queued" });
    }
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, updates: Partial<ImportItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }

  async function processItem(item: ImportItem, signal: AbortSignal): Promise<boolean> {
    updateItem(item.id, { status: "processing" });
    try {
      if (item.fileType === "video") {
        // Step 1: Get presigned upload URL for video
        const videoUrlRes = await fetch("/api/upload-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: item.file.name }),
          signal,
        });
        if (!videoUrlRes.ok) throw new Error("Failed to prepare upload");

        const { path: videoPath, token: videoToken, publicUrl: videoPublicUrl } = await videoUrlRes.json();

        // Step 2: Upload video directly to Supabase
        const supabase = createClient();
        const { error: videoUploadError } = await supabase.storage
          .from("processed")
          .uploadToSignedUrl(videoPath, videoToken, item.file, {
            contentType: item.file.type || "video/mp4",
          });
        if (videoUploadError) throw new Error(`Video upload failed: ${videoUploadError.message}`);

        // Step 3: Create module — returns immediately, async processing starts
        const modRes = await fetch("/api/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input_type: "video",
            title: item.file.name.replace(/\.[^.]+$/, ""),
            original_video_url: videoPublicUrl,
          }),
          signal,
        });
        if (!modRes.ok) {
          const err = await modRes.json();
          throw new Error(err.error || "Module creation failed");
        }
        const data = await modRes.json();
        updateItem(item.id, { status: "done", moduleId: data.id });
      } else {
        if (item.file.size > MAX_DOCUMENT_SIZE_BYTES) {
          throw new Error("File is too large. Max size for documents is 4.5MB.");
        }
        const fd = new FormData();
        fd.append("file", item.file);
        const res = await fetch("/api/import-sop", { method: "POST", body: fd, signal });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Import failed — the file may be too large or in an unsupported format.");
        }
        const data = await res.json();
        updateItem(item.id, { status: "done", moduleId: data.id });
      }
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        updateItem(item.id, { status: "queued" });
      } else {
        updateItem(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Something went wrong",
        });
      }
      return false;
    }
  }

  async function handleImport() {
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    const queued = items.filter((i) => i.status === "queued");
    let errorCount = 0;
    for (const item of queued) {
      if (controller.signal.aborted) break;
      const success = await processItem(item, controller.signal);
      if (!success) errorCount++;
    }
    abortRef.current = null;
    setRunning(false);
    if (!controller.signal.aborted && errorCount === 0) {
      setItems([]);
      onClose();
      router.push("/dashboard");
      router.refresh();
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleClose() {
    abortRef.current?.abort();
    const hasDone = items.some((i) => i.status === "done");
    setItems([]);
    setRunning(false);
    onClose();
    if (hasDone) router.refresh();
  }

  const queuedItems = items.filter((i) => i.status === "queued");
  const allDone = items.length > 0 && items.every((i) => i.status === "done" || i.status === "error");
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorItems = items.filter((i) => i.status === "error");

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import SOPs"
      description="Drop PDFs, Word docs, or videos — each file becomes its own training module."
      className="max-w-lg"
    >
      {/* Drop zone — hide while running */}
      {!running && (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-4",
            dragging
              ? "border-accent bg-accent/5"
              : "border-[var(--color-border)] hover:border-accent/50 hover:bg-white/2"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-[var(--color-border)] flex items-center justify-center">
              <Upload className="h-5 w-5 text-text-secondary" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Drop files here, or <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-text-secondary">PDF, DOCX, MP4, MOV · Multiple files at once</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.mp4,.mov,.webm,.avi,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,video/quicktime,video/webm,video/x-msvideo"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>
      )}

      {/* File list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 bg-background rounded-lg border border-[var(--color-border)]"
            >
              <div className="shrink-0 text-text-secondary">
                {item.fileType === "video" ? (
                  <Film className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>
              <p className="flex-1 min-w-0 text-sm text-text-primary truncate">{item.file.name}</p>
              <TypeBadge type={item.fileType} />
              <div className="shrink-0 w-5 flex items-center justify-center">
                {item.status === "queued" && !running && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {item.status === "queued" && running && (
                  <span className="w-2 h-2 rounded-full bg-white/20" />
                )}
                {item.status === "processing" && (
                  <Loader2 className="h-4 w-4 text-accent animate-spin" />
                )}
                {item.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                )}
                {item.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error details */}
      {errorItems.length > 0 && (
        <div className="mb-4 flex flex-col gap-1">
          {errorItems.map((i) => (
            <p key={i.id} className="text-xs text-red-400">
              <span className="font-medium">{i.file.name}:</span> {i.error}
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-text-secondary">
          {running
            ? `Processing files…`
            : allDone
            ? `${doneCount} of ${items.length} imported${errorItems.length > 0 ? ` (${errorItems.length} failed)` : ""}`
            : items.length > 0
            ? `${items.length} file${items.length !== 1 ? "s" : ""} ready`
            : "No files selected yet"}
        </p>
        <div className="flex gap-2">
          {running ? (
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Stop Import
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleClose}>
              {allDone ? "Close" : "Cancel"}
            </Button>
          )}
          {!allDone && !running && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={queuedItems.length === 0}
            >
              <Upload className="h-4 w-4" />
              {`Import ${queuedItems.length} ${queuedItems.length === 1 ? "file" : "files"}`}
            </Button>
          )}
          {running && (
            <Button variant="primary" size="sm" disabled loading>
              Importing…
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
