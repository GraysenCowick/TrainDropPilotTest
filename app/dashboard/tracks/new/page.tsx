"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, ChevronUp, ChevronDown, Video, FileText, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

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

export default function NewTrackPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allModules, setAllModules] = useState<PickerModule[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then((data) => {
        setAllModules((data || []).filter((m: PickerModule) => m.status === "ready" || m.status === "published"));
        setLoadingModules(false);
      });
  }, []);

  function toggleModule(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
    if (!title.trim()) { toast("Track title is required", "error"); return; }
    if (selectedIds.length === 0) { toast("Add at least one module", "error"); return; }

    setSaving(true);
    const res = await fetch("/api/tracks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, module_ids: selectedIds }),
    });

    if (res.ok) {
      const track = await res.json();
      toast("Training track created!", "success");
      router.push(`/dashboard/tracks/${track.id}`);
    } else {
      toast("Failed to create track", "error");
      setSaving(false);
    }
  }

  const selectedModules = selectedIds
    .map((id) => allModules.find((m) => m.id === id))
    .filter(Boolean) as PickerModule[];

  const unselectedModules = allModules.filter((m) => !selectedIds.includes(m.id));

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">New Training Track</h1>
          <p className="text-sm text-text-secondary mt-1">
            Bundle modules into a sequential onboarding experience.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleSave} loading={saving}>
          Save Track
        </Button>
      </div>

      {/* Track info */}
      <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 mb-6 flex flex-col gap-4">
        <Input
          label="Track Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. New Barista Onboarding"
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">
            Description <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will employees learn in this track?"
            rows={2}
            className="w-full bg-background border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module library */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Module Library
            <span className="ml-2 text-xs text-text-secondary font-normal">
              Click to add to track
            </span>
          </h2>
          {loadingModules ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />
              ))}
            </div>
          ) : allModules.length === 0 ? (
            <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6 text-center">
              <p className="text-sm text-text-secondary">
                No published modules yet. Create modules first, then bundle them into a track.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {unselectedModules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className="flex items-center gap-3 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-xl text-left hover:border-accent/40 hover:bg-accent/5 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-accent transition-colors shrink-0">
                    {inputTypeIcon(m.input_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{m.title}</p>
                    <p className="text-xs text-text-secondary">{inputTypeLabel(m.input_type)}</p>
                  </div>
                  <Plus className="h-4 w-4 text-text-secondary group-hover:text-accent transition-colors shrink-0" />
                </button>
              ))}
              {unselectedModules.length === 0 && selectedIds.length > 0 && (
                <p className="text-sm text-text-secondary text-center py-4">
                  All modules added to this track.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Track contents */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Track Contents
            <span className="ml-2 text-xs text-text-secondary font-normal">
              {selectedIds.length} module{selectedIds.length !== 1 ? "s" : ""} · use arrows to reorder
            </span>
          </h2>

          {selectedModules.length === 0 ? (
            <div className="bg-surface border border-dashed border-[var(--color-border)] rounded-xl p-8 text-center">
              <p className="text-sm text-text-secondary">
                No modules added yet. Select from the library on the left.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedModules.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-xl"
                >
                  <span className="text-xs font-bold text-accent w-5 text-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary shrink-0">
                    {inputTypeIcon(m.input_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{m.title}</p>
                    <p className="text-xs text-text-secondary">{inputTypeLabel(m.input_type)}</p>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Link href="/dashboard">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Track
        </Button>
      </div>
    </div>
  );
}
