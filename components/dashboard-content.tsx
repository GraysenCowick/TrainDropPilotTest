"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, LayoutGrid, Users, ListOrdered, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ModuleCard } from "@/components/module-card";
import { TeamTab } from "@/components/team-tab";
import { ImportSOPModal } from "@/components/import-sop-modal";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import type { Module } from "@/lib/supabase/types";

type EnrichedModule = Module & {
  completion_count: number;
  assignment_count: number;
};

interface EnrichedTrack {
  id: string;
  title: string;
  description: string | null;
  module_count: number;
  created_at: string;
}

type Tab = "modules" | "tracks" | "team";

interface DashboardContentProps {
  modules: EnrichedModule[];
  tracks: EnrichedTrack[];
  teamMemberCount: number;
}

export function DashboardContent({ modules, tracks, teamMemberCount }: DashboardContentProps) {
  const [tab, setTab] = useState<Tab>("modules");
  const [importOpen, setImportOpen] = useState(false);

  // Read ?tab= from URL on mount (e.g. navigated here from "Add Team Members" button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "modules" || t === "tracks" || t === "team") setTab(t);
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <div className="flex items-center gap-2">
          {tab === "modules" && (
            <>
              <Button variant="ghost" size="md" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" />
                Import SOPs
              </Button>
              <Link href="/dashboard/modules/new">
                <Button variant="primary" size="md">
                  <Plus className="h-4 w-4" />
                  New Module
                </Button>
              </Link>
            </>
          )}
          {tab === "tracks" && (
            <Link href="/dashboard/tracks/new">
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4" />
                New Track
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-[var(--color-border)] rounded-xl p-1 w-fit mb-6">
        {(["modules", "tracks", "team"] as Tab[]).map((t) => {
          const icons = { modules: <LayoutGrid className="h-4 w-4" />, tracks: <ListOrdered className="h-4 w-4" />, team: <Users className="h-4 w-4" /> };
          const labels = { modules: "Modules", tracks: "Tracks", team: "Team" };
          const counts = { modules: modules.length, tracks: tracks.length, team: teamMemberCount };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t ? "bg-accent text-background" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {icons[t]}
              {labels[t]}
              {counts[t] > 0 && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", tab === t ? "bg-background/20" : "bg-white/10")}>
                  {counts[t]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "modules" && (
        modules.length === 0 ? <ModulesEmptyState /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => <ModuleCard key={module.id} module={module} />)}
          </div>
        )
      )}

      {tab === "tracks" && (
        tracks.length === 0 ? <TracksEmptyState /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => <TrackCard key={track.id} track={track} />)}
          </div>
        )
      )}

      {tab === "team" && <TeamTab />}

      <ImportSOPModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function TrackCard({ track }: { track: EnrichedTrack }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/tracks/${track.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteOpen(false);
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="relative group">
      <Link href={`/dashboard/tracks/${track.id}`}>
        <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <ListOrdered className="h-4.5 w-4.5 text-accent" />
            </div>
            <span className="text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-full">
              {track.module_count} module{track.module_count !== 1 ? "s" : ""}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2 group-hover:text-accent transition-colors">
            {track.title}
          </h3>
          {track.description && (
            <p className="text-xs text-text-secondary line-clamp-2 mb-2">{track.description}</p>
          )}
          <p className="text-xs text-text-secondary mt-2">{formatRelativeDate(track.created_at)}</p>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteOpen(true); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-surface border border-[var(--color-border)] text-text-secondary hover:text-red-400 hover:border-red-500/30 z-10"
        title="Delete track"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Track"
        description="This will permanently delete this training track. Modules themselves will not be affected. This cannot be undone."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} loading={deleting}>Delete Track</Button>
        </div>
      </Dialog>
    </div>
  );
}

function ModulesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <FileText className="h-7 w-7 text-accent" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">No training modules yet</h2>
      <p className="text-sm text-text-secondary max-w-xs mb-6">
        Upload a video or paste your notes to generate your first training module.
      </p>
      <Link href="/dashboard/modules/new">
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          Create Your First Module
        </Button>
      </Link>
    </div>
  );
}

function TracksEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <ListOrdered className="h-7 w-7 text-accent" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">No training tracks yet</h2>
      <p className="text-sm text-text-secondary max-w-xs mb-6">
        Bundle your modules into a sequential onboarding track for new employees.
      </p>
      <Link href="/dashboard/tracks/new">
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          Create Your First Track
        </Button>
      </Link>
    </div>
  );
}


