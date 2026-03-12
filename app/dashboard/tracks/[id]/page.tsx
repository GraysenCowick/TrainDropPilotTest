"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Video,
  FileText,
  Mic,
  Send,
  BarChart3,
  Globe,
  EyeOff,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { SendTrackModal } from "@/components/send-track-modal";
import { TrackCompletionStatus } from "@/components/track-completion-status";

interface TrackModule {
  id: string;
  sort_order: number;
  module_id: string;
  modules: {
    id: string;
    title: string;
    status: string;
    input_type: string;
    share_slug: string | null;
  };
}

interface Track {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published";
  created_at: string;
  track_modules: TrackModule[];
}

interface PickerModule {
  id: string;
  title: string;
  status: string;
  input_type: string;
}

function inputTypeIcon(type: string) {
  if (type === "video") return <Video className="h-3.5 w-3.5" />;
  if (type === "audio") return <Mic className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function inputTypeLabel(type: string) {
  if (type === "video") return "Video";
  if (type === "audio") return "Audio";
  return "Document";
}

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allModules, setAllModules] = useState<PickerModule[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    fetchTrack();
    fetch("/api/modules")
      .then((r) => r.json())
      .then((data) =>
        setAllModules(
          (data || []).filter(
            (m: PickerModule) => m.status === "ready" || m.status === "published"
          )
        )
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchTrack() {
    const res = await fetch(`/api/tracks/${id}`);
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const data: Track = await res.json();
    setTrack(data);
    setTitle(data.title);
    setDescription(data.description || "");
    setSelectedIds(data.track_modules.map((tm) => tm.module_id));
    setLoading(false);
  }

  function toggleModule(moduleId: string) {
    setSelectedIds((prev) =>
      prev.includes(moduleId) ? prev.filter((x) => x !== moduleId) : [...prev, moduleId]
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setSelectedIds((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      toast("Title is required", "error");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/tracks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, module_ids: selectedIds }),
    });
    if (res.ok) {
      toast("Track saved", "success");
      await fetchTrack();
    } else {
      toast("Failed to save", "error");
    }
    setSaving(false);
  }

  async function handlePublish() {
    if (!title.trim()) {
      toast("Title is required", "error");
      return;
    }
    setPublishing(true);
    // Save current state first, then publish
    const saveRes = await fetch(`/api/tracks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, module_ids: selectedIds }),
    });
    if (!saveRes.ok) {
      toast("Failed to save before publishing", "error");
      setPublishing(false);
      return;
    }
    const pubRes = await fetch(`/api/tracks/${id}/publish`, { method: "POST" });
    if (pubRes.ok) {
      toast("Track published!", "success");
      await fetchTrack();
    } else {
      toast("Failed to publish", "error");
    }
    setPublishing(false);
  }

  async function handleUnpublish() {
    setUnpublishing(true);
    const res = await fetch(`/api/tracks/${id}/unpublish`, { method: "POST" });
    if (res.ok) {
      toast("Track unpublished", "info");
      setUnpublishOpen(false);
      await fetchTrack();
    } else {
      toast("Failed to unpublish", "error");
    }
    setUnpublishing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/tracks/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      toast("Failed to delete track", "error");
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) return null;

  const isPublished = track.status === "published";

  const selectedModules = selectedIds
    .map((sid) => allModules.find((m) => m.id === sid))
    .filter(Boolean) as PickerModule[];

  const unselectedModules = allModules.filter((m) => !selectedIds.includes(m.id));

  return (
    <div className="max-w-3xl mx-auto">
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
          {isPublished ? (
            <h1 className="text-2xl font-bold text-text-primary">{track.title}</h1>
          ) : (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-text-primary bg-transparent border-none outline-none focus:ring-0 placeholder:text-text-secondary"
              placeholder="Track title..."
            />
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={isPublished ? "success" : "default"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
            <span className="text-xs text-text-secondary">
              {selectedIds.length} module{selectedIds.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {isPublished ? (
            <>
              <Button variant="primary" size="sm" onClick={() => setSendModalOpen(true)}>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send to Team</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowStatus((v) => !v)}>
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Status</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setUnpublishOpen(true)}>
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Unpublish</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowPicker((v) => !v)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Module</span>
              </Button>
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
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-2 text-text-secondary hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Published lock notice */}
      {isPublished && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl mb-6 text-sm text-text-secondary">
          <Lock className="h-4 w-4 text-accent shrink-0" />
          This track is published and locked. Unpublish to make edits.
        </div>
      )}

      {/* Description */}
      <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">
          Description
        </label>
        {isPublished ? (
          <p className="text-sm text-text-primary">
            {track.description || (
              <span className="text-text-secondary italic">No description</span>
            )}
          </p>
        ) : (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description for this track..."
            rows={2}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none resize-none"
          />
        )}
      </div>

      {/* Team Completion Status */}
      {showStatus && (
        <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Team Status</h2>
          <TrackCompletionStatus trackId={id} />
        </div>
      )}

      {/* Module picker (draft only) */}
      {!isPublished && showPicker && unselectedModules.length > 0 && (
        <div className="bg-surface border border-accent/20 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
            Add Modules
          </p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {unselectedModules.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleModule(m.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent/5 transition-colors group"
              >
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-text-secondary shrink-0">
                  {inputTypeIcon(m.input_type)}
                </div>
                <span className="text-sm text-text-primary flex-1 truncate">{m.title}</span>
                <Plus className="h-3.5 w-3.5 text-text-secondary group-hover:text-accent transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Track modules list */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Modules in Order</h2>

        {selectedModules.length === 0 ? (
          <div className="bg-surface border border-dashed border-[var(--color-border)] rounded-xl p-10 text-center">
            <p className="text-sm text-text-secondary">
              {isPublished
                ? "No modules in this track."
                : "No modules yet. Click \"Add Module\" above to get started."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedModules.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-xl"
              >
                <span className="text-sm font-bold text-accent w-6 text-center shrink-0">
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary shrink-0">
                  {inputTypeIcon(m.input_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{m.title}</p>
                  <p className="text-xs text-text-secondary">{inputTypeLabel(m.input_type)}</p>
                </div>
                {!isPublished && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === selectedModules.length - 1}
                      className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleModule(m.id)}
                      className="p-1 text-text-secondary hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 mt-6 border-t border-[var(--color-border)]">
        <button
          onClick={() => setDeleteOpen(true)}
          className="text-xs text-text-secondary hover:text-red-400 transition-colors"
        >
          Delete this track
        </button>
      </div>

      {/* Delete dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Track"
        description="This will permanently delete this training track. Modules themselves will not be affected. This cannot be undone."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={deleting}>
            Delete Track
          </Button>
        </div>
      </Dialog>

      {/* Unpublish confirmation dialog */}
      <Dialog
        open={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        title="Unpublish Track"
        description="This will unlock the track for editing. Employees who already received a link can still view the current version until you republish."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setUnpublishOpen(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleUnpublish} loading={unpublishing}>
            Unpublish
          </Button>
        </div>
      </Dialog>

      <SendTrackModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        trackId={id}
        trackTitle={track.title}
      />
    </div>
  );
}
