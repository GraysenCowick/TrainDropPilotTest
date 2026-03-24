"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  LayoutGrid,
  Users,
  ListOrdered,
  Trash2,
  Upload,
  CheckCircle2,
  Circle,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ModuleCard } from "@/components/module-card";
import { TeamTab } from "@/components/team-tab";
import { ImportSOPModal } from "@/components/import-sop-modal";
import { WelcomeModal } from "@/components/welcome-modal";
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
  userId: string;
}

export function DashboardContent({ modules, tracks, teamMemberCount, userId }: DashboardContentProps) {
  const [tab, setTab] = useState<Tab>("modules");
  const [importOpen, setImportOpen] = useState(false);
  const [teamCount, setTeamCount] = useState(teamMemberCount);

  // Read ?tab= from URL on mount (e.g. navigated here from "Add Team Members" button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "modules" || t === "tracks" || t === "team") setTab(t);
  }, []);

  const hasModule = modules.length > 0;
  const hasSentModule = modules.some((m) => m.assignment_count > 0);
  const firstPublishedModuleId = modules.find((m) => m.status === "published")?.id ?? null;

  return (
    <div>
      <WelcomeModal userId={userId} />

      {/* Getting Started checklist */}
      <GettingStartedChecklist
        hasModule={hasModule}
        hasTeamMember={teamCount > 0}
        hasSentModule={hasSentModule}
        firstPublishedModuleId={firstPublishedModuleId}
        onSwitchTab={setTab}
      />

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <div className="flex items-center gap-2">
          {tab === "modules" && (
            <>
              <Button variant="ghost" size="md" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import Existing SOPs</span>
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
          const counts = { modules: modules.length, tracks: tracks.length, team: teamCount };
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

      {tab === "team" && <TeamTab onCountChange={setTeamCount} />}

      <ImportSOPModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function GettingStartedChecklist({
  hasModule,
  hasTeamMember,
  hasSentModule,
  firstPublishedModuleId,
  onSwitchTab,
}: {
  hasModule: boolean;
  hasTeamMember: boolean;
  hasSentModule: boolean;
  firstPublishedModuleId: string | null;
  onSwitchTab: (tab: Tab) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("traindrop_checklist_dismissed")) setDismissed(true);
  }, []);

  function dismiss() {
    localStorage.setItem("traindrop_checklist_dismissed", "1");
    setDismissed(true);
  }

  const steps = [
    { label: "Create your account", done: true, action: null },
    {
      label: "Create your first module",
      done: hasModule,
      action: (
        <Link href="/dashboard/modules/new" className="text-xs text-accent hover:underline shrink-0">
          Create now
        </Link>
      ),
    },
    {
      label: "Add an employee",
      done: hasTeamMember,
      action: (
        <button
          onClick={() => onSwitchTab("team")}
          className="text-xs text-accent hover:underline shrink-0"
        >
          Add now
        </button>
      ),
    },
    {
      label: "Send your first training",
      done: hasSentModule,
      action: firstPublishedModuleId ? (
        <Link
          href={`/dashboard/modules/${firstPublishedModuleId}`}
          className="text-xs text-accent hover:underline shrink-0"
        >
          Send now
        </Link>
      ) : (
        <span className="text-xs text-text-secondary shrink-0">Publish a module first</span>
      ),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (!mounted || dismissed || allDone) return null;

  return (
    <div className="bg-surface border border-[var(--color-border)] rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-text-primary">Getting Started</p>
          <span className="text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded-full">
            {completedCount} / 4
          </span>
        </div>
        <button
          onClick={dismiss}
          className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-white/5"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-[var(--color-border)] shrink-0" />
            )}
            <span
              className={cn(
                "text-sm flex-1",
                step.done ? "text-text-secondary line-through" : "text-text-primary"
              )}
            >
              {step.label}
            </span>
            {!step.done && step.action}
          </div>
        ))}
      </div>
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <FileText className="h-7 w-7 text-accent" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">No training modules yet</h2>
      <p className="text-sm text-text-secondary max-w-xs mb-1">
        Upload a video or paste your notes — AI writes the SOP and adds captions automatically.
      </p>
      <p className="text-sm text-text-secondary max-w-xs mb-6">
        Then publish it, send it to your team, and see exactly who finished.
      </p>
      <Link href="/dashboard/modules/new">
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          Create Your First Module
        </Button>
      </Link>
      <div className="flex items-center gap-1.5 mt-8 text-xs text-text-secondary flex-wrap justify-center">
        <span className="text-text-primary font-medium">Create</span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-text-primary font-medium">Publish</span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-text-primary font-medium">Send to team</span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-text-primary font-medium">Track who finished</span>
      </div>
    </div>
  );
}

function TracksEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <ListOrdered className="h-7 w-7 text-accent" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">No training tracks yet</h2>
      <p className="text-sm text-text-secondary max-w-sm mb-1">
        Tracks let you chain multiple modules into a complete onboarding experience.
      </p>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        Employees complete them in order — perfect for multi-step role training or new hire onboarding.
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
