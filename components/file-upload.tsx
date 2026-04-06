"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Film, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAcceptedVideo, MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_MB } from "@/lib/constants";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileChange, disabled }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (!isAcceptedVideo(f)) {
      return `Invalid file type. Accepted: MP4, MOV, WebM, AVI`;
    }
    if (f.size > MAX_VIDEO_SIZE_BYTES) {
      return `File too large. Max size: ${MAX_VIDEO_SIZE_MB}MB`;
    }
    return null;
  }, []);

  function handleFile(f: File) {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFile(f);
    onFileChange(f);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileChange(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  if (file) {
    return (
      <div className="border border-[var(--color-border)] rounded-xl p-4 bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Film className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-secondary">
              {(file.size / (1024 * 1024)).toFixed(1)} MB · Ready to upload
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={clearFile}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center transition-all",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : dragging
            ? "border-accent bg-accent/5 cursor-pointer"
            : "border-[var(--color-border)] hover:border-accent/50 hover:bg-white/2 cursor-pointer"
        )}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={disabled ? undefined : handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-[var(--color-border)] flex items-center justify-center">
            <Upload className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Drop your video here, or{" "}
              <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">
              MP4, MOV, WebM, AVI · Max {MAX_VIDEO_SIZE_MB}MB
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,.webm,.avi,video/mp4,video/quicktime,video/webm,video/x-msvideo"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
