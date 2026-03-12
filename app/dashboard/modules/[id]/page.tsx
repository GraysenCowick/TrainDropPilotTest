"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Globe,
  EyeOff,
  Trash2,
  Save,
  Send,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { SOPEditor } from "@/components/sop-editor";
import { ProcessingStatus } from "@/components/processing-status";
import { VideoPlayer } from "@/components/video-player";
import { ShareLink } from "@/components/share-link";
import { SendToTeamModal } from "@/components/send-to-team-modal";
import { TeamCompletionStatus } from "@/components/team-completion-status";
import { useToast } from "@/components/ui/toast";
import type { Module } from "@/lib/supabase/types";

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [sopContent, setSopContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCompletionStatus, setShowCompletionStatus] = useState(false);

  // Regenerate rate-limit state
  const [regenerating, setRegenerating] = useState(false);
  const [regenCount, setRegenCount] = useState(0);
  const REGEN_MAX = 3;
  const REGEN_WINDOW = 5 * 60 * 1000; // 5 minutes

  function getRegenTimestamps(): number[] {
    try {
      const raw = localStorage.getItem(`regen_${id}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch { return []; }
  }

  function refreshRegenCount() {
    const now = Date.now();
    const recent = getRegenTimestamps().filter((t) => now - t < REGEN_WINDOW);
    setRegenCount(recent.length);
  }

  function recordRegen() {
    const now = Date.now();
    const recent = getRegenTimestamps().filter((t) => now - t < REGEN_WINDOW);
    recent.push(now);
    localStorage.setItem(`regen_${id}`, JSON.stringify(recent));
    setRegenCount(recent.length);
  }

  const canRegenerate = regenCount < REGEN_MAX && !regenerating;

  useEffect(() => {
    fetchModule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchModule() {
    const res = await fetch(`/api/modules/${id}`);
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setModule(data);
    setTitle(data.title || "");
    setSopContent(data.sop_content || "");
    setLoading(false);
    refreshRegenCount();
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, sop_content: sopContent }),
    });

    if (res.ok) {
      toast("Saved successfully", "success");
      const data = await res.json();
      setModule(data);
    } else {
      toast("Failed to save", "error");
    }
    setSaving(false);
  }

  async function handlePublish() {
    setPublishing(true);
    const res = await fetch(`/api/modules/${id}/publish`, { method: "POST" });

    if (res.ok) {
      toast("Module published!", "success");
      await fetchModule();
    } else {
      toast("Failed to publish", "error");
    }
    setPublishing(false);
  }

  async function handleUnpublish() {
    const res = await fetch(`/api/modules/${id}/unpublish`, { method: "POST" });
    if (res.ok) {
      toast("Module unpublished", "info");
      await fetchModule();
    } else {
      toast("Failed to unpublish", "error");
    }
  }

  async function handleRegenerate() {
    if (!canRegenerate) return;
    recordRegen();
    setRegenerating(true);
    const res = await fetch(`/api/modules/${id}/regenerate-sop`, { method: "POST" });
    if (res.ok) {
      await fetchModule();
    } else {
      toast("Failed to regenerate", "error");
      refreshRegenCount();
    }
    setRegenerating(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/modules/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      toast("Failed to delete module", "error");
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!module) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          {module.status !== "processing" ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-text-primary bg-transparent border-none outline-none focus:ring-0 placeholder:text-text-secondary"
              placeholder="Module title..."
            />
          ) : (
            <h1 className="text-2xl font-bold text-text-primary">
              {module.title}
            </h1>
          )}
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={module.status} />
            <span className="text-xs text-text-secondary capitalize">
              {module.input_type} module
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {(module.status === "ready" || module.status === "error") && (
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={!canRegenerate}
                loading={regenerating}
              >
                {!regenerating && <RefreshCw className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {regenerating ? "Regenerating…" : "Regenerate"}
                </span>
              </Button>
              {regenCount >= REGEN_MAX && (
                <p className="text-xs text-text-secondary pr-1">
                  Please wait before regenerating again.
                </p>
              )}
            </div>
          )}

          {module.status === "ready" && (
            <>
              <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button variant="primary" size="sm" onClick={handlePublish} loading={publishing}>
                <Globe className="h-4 w-4" />
                Publish
              </Button>
            </>
          )}

          {module.status === "published" && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowSendModal(true)}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send to Team</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompletionStatus((v) => !v)}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Status</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleUnpublish}>
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Unpublish</span>
              </Button>
            </>
          )}

          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="p-2 text-text-secondary hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {module.status === "processing" ? (
        <ProcessingStatus moduleId={id} inputType={module.input_type} onComplete={fetchModule} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Error banner */}
          {module.status === "error" && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Processing failed</p>
                <p className="text-sm text-text-secondary mt-0.5">
                  Something went wrong while processing this module. Try regenerating the SOP, or delete this module and re-upload your content.
                </p>
              </div>
            </div>
          )}
          {/* Share link (published) */}
          {module.status === "published" && module.share_slug && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
              <ShareLink slug={module.share_slug} />
            </div>
          )}

          {/* Team Completion Status (published) */}
          {module.status === "published" && showCompletionStatus && (
            <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                Completion Status
              </h2>
              <TeamCompletionStatus moduleId={id} />
            </div>
          )}

          {/* Video preview (video modules only) */}
          {module.input_type === "video" && module.processed_video_url && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                Training Video
              </h2>
              <VideoPlayer
                src={module.processed_video_url}
                vttContent={module.vtt_content || undefined}
                chapters={
                  (module.chapters as unknown as Array<{
                    title: string;
                    start_time: number;
                    summary: string;
                  }>) || undefined
                }
              />
            </div>
          )}

          {/* SOP Editor */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              Standard Operating Procedure
            </h2>
            <SOPEditor
              value={sopContent}
              onChange={setSopContent}
              readOnly={false}
              loading={regenerating}
            />
          </div>

          {/* Delete button */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="text-xs text-text-secondary hover:text-red-400 transition-colors"
            >
              Delete this module
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Module"
        description="This will permanently delete this module and all its completions. This action cannot be undone."
      >
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={deleting}
          >
            Delete Module
          </Button>
        </div>
      </Dialog>

      {/* Send to Team modal */}
      {module.status === "published" && module.share_slug && (
        <SendToTeamModal
          open={showSendModal}
          onClose={() => setShowSendModal(false)}
          moduleId={id}
          moduleSlug={module.share_slug}
        />
      )}
    </div>
  );
}
