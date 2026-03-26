"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Globe,
  EyeOff,
  Trash2,
  Save,
  Send,
  BarChart3,
  AlertTriangle,
  Info,
  X,
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
  const [description, setDescription] = useState("");
  const [sopContent, setSopContent] = useState("");
  const [quizScores, setQuizScores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCompletionStatus, setShowCompletionStatus] = useState(false);

  const [readyBannerDismissed, setReadyBannerDismissed] = useState(false);

  // Refine SOP state
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineCount, setRefineCount] = useState(0);
  const REFINE_MAX = 5;
  const REFINE_WINDOW = 5 * 60 * 1000; // 5 minutes

  function getRefineTimestamps(): number[] {
    try {
      const raw = localStorage.getItem(`refine_${id}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch { return []; }
  }

  function refreshRefineCount() {
    const now = Date.now();
    const recent = getRefineTimestamps().filter((t) => now - t < REFINE_WINDOW);
    setRefineCount(recent.length);
  }

  function recordRefine() {
    const now = Date.now();
    const recent = getRefineTimestamps().filter((t) => now - t < REFINE_WINDOW);
    recent.push(now);
    localStorage.setItem(`refine_${id}`, JSON.stringify(recent));
    setRefineCount(recent.length);
  }

  useEffect(() => {
    fetchModule();
    if (localStorage.getItem(`traindrop_ready_banner_${id}`)) setReadyBannerDismissed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!showCompletionStatus) return;
    fetch(`/api/modules/${id}/quiz-scores`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setQuizScores(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [showCompletionStatus, id]);

  async function fetchModule() {
    const res = await fetch(`/api/modules/${id}`);
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setModule(data);
    setTitle(data.title || "");
    setDescription(data.description || "");
    setSopContent(data.sop_content || "");
    setLoading(false);
    refreshRefineCount();
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, sop_content: sopContent }),
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

  async function handleRefine() {
    if (!refineInstruction.trim() || refineCount >= REFINE_MAX) return;
    recordRefine();
    setRefining(true);
    const res = await fetch(`/api/modules/${id}/refine-sop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: refineInstruction.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setSopContent(data.sop_content);
      setRefineInstruction("");
      setRefineOpen(false);
      toast("SOP updated", "success");
    } else {
      toast("Failed to refine SOP", "error");
      refreshRefineCount();
    }
    setRefining(false);
  }

  function dismissReadyBanner() {
    localStorage.setItem(`traindrop_ready_banner_${id}`, "1");
    setReadyBannerDismissed(true);
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
          {module.status !== "processing" && (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm text-text-secondary bg-transparent border-none outline-none focus:ring-0 resize-none placeholder:text-text-secondary/50 mt-1"
              placeholder="Add a description..."
              rows={2}
            />
          )}
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={module.status} />
            <span className="text-xs text-text-secondary">
              {module.input_type === "video" ? "Video module" : "Notes module"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {module.status === "ready" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRefineOpen((v) => !v)}
              disabled={refining}
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Refine</span>
            </Button>
          )}

          {module.status === "ready" && (
            <>
              <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublish}
                loading={publishing}
                title="Make this module shareable with your team"
              >
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
          {/* "What's next?" banner — shown when module is ready but not yet published */}
          {module.status === "ready" && !readyBannerDismissed && (
            <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl p-4">
              <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Your module is ready!</p>
                <p className="text-sm text-text-secondary mt-0.5">
                  Review the SOP below, then click{" "}
                  <span className="font-semibold text-text-primary">Publish</span> above to make it
                  shareable with your team.
                </p>
              </div>
              <button
                onClick={dismissReadyBanner}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-white/5 shrink-0"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

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
              {quizScores.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Quiz Scores</h3>
                  <div className="flex flex-col gap-2">
                    {quizScores.map((s) => (
                      <div key={s.completion_id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/50 last:border-0">
                        <div>
                          <p className="text-sm text-text-primary">{s.employee_name}</p>
                          <p className="text-xs text-text-secondary">{s.employee_email}</p>
                        </div>
                        <div className="text-right">
                          {s.quiz_score !== null ? (
                            <span className={`text-sm font-semibold ${s.quiz_score >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {s.quiz_score}%
                            </span>
                          ) : (
                            <span className="text-xs text-text-secondary">Not attempted</span>
                          )}
                          {s.quiz_attempted > 0 && (
                            <p className="text-xs text-text-secondary">{s.quiz_correct}/{s.quiz_attempted} correct</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Refine panel */}
          {refineOpen && (
            <div className="bg-surface border border-accent/20 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-accent" />
                <p className="text-sm font-medium text-text-primary">Refine SOP with AI</p>
              </div>
              <textarea
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder={`Describe what you'd like to change… e.g. "Add a safety section before Step 1", "Make the tone more formal", "Expand Phase 2 with more detail"`}
                className="w-full bg-background border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 min-h-[88px]"
                disabled={refining}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {REFINE_MAX - refineCount} of {REFINE_MAX} refinements remaining
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setRefineOpen(false); setRefineInstruction(""); }}
                    disabled={refining}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRefine}
                    loading={refining}
                    disabled={!refineInstruction.trim() || refineCount >= REFINE_MAX}
                  >
                    {!refining && <Wand2 className="h-4 w-4" />}
                    {refining ? "Applying…" : "Apply Changes"}
                  </Button>
                </div>
              </div>
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
              loading={refining}
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
