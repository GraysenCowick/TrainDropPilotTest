"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, AlertCircle, Circle, ChevronRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video-player";

interface ModuleData {
  id: string;
  title: string;
  sop_content: string | null;
  processed_video_url: string | null;
  vtt_content: string | null;
  chapters: Array<{ title: string; start_time: number; summary: string }> | null;
  completed_at: string | null;
}

interface TrackViewData {
  assignment: {
    id: string;
    employee_name: string | null;
    employee_email: string;
    assigned_at: string;
    completed_at: string | null;
  };
  track: {
    id: string;
    title: string;
    description: string | null;
  };
  modules: ModuleData[];
}

export default function TrackViewPage() {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<TrackViewData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [trackDone, setTrackDone] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    fetch(`/api/tracks/assignment/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d: TrackViewData | null) => {
        if (!d) return;
        setData(d);
        if (d.assignment.completed_at) setTrackDone(true);
        // Start on first incomplete module
        const firstIncomplete = d.modules.findIndex((m) => !m.completed_at);
        setCurrentIndex(firstIncomplete === -1 ? 0 : firstIncomplete);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Reset video progress when switching modules
  useEffect(() => {
    setVideoProgress(0);
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  async function handleCompleteModule() {
    if (!data) return;
    const mod = data.modules[currentIndex];
    setCompleting(true);

    const res = await fetch(`/api/tracks/assignment/${token}/complete-module`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id: mod.id }),
    });

    if (res.ok) {
      const result = await res.json();
      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        const modules = prev.modules.map((m, i) =>
          i === currentIndex ? { ...m, completed_at: new Date().toISOString() } : m
        );
        return {
          ...prev,
          modules,
          assignment: {
            ...prev.assignment,
            completed_at: result.trackCompletedAt ?? prev.assignment.completed_at,
          },
        };
      });
      if (result.allComplete) {
        setTrackDone(true);
      } else {
        // Advance to next incomplete module
        const nextIndex = data.modules.findIndex(
          (m, i) => i > currentIndex && !m.completed_at
        );
        if (nextIndex !== -1) setCurrentIndex(nextIndex);
      }
    }
    setCompleting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-text-secondary" />
        <h1 className="text-xl font-semibold text-text-primary">Training not found</h1>
        <p className="text-sm text-text-secondary max-w-xs">
          This training link may have expired or been removed.
        </p>
      </div>
    );
  }

  const { assignment, track, modules } = data;
  const completedCount = modules.filter((m) => m.completed_at).length;
  const totalCount = modules.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const currentModule = modules[currentIndex];
  const canComplete =
    !currentModule.completed_at &&
    (!currentModule.processed_video_url || videoProgress >= 80);

  if (trackDone) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-[var(--color-border)] bg-surface/50 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Logo />
            <div className="text-right">
              <p className="text-xs text-text-secondary">Viewing as</p>
              <p className="text-sm font-medium text-text-primary">
                {assignment.employee_name || assignment.employee_email}
              </p>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Track Complete!</h1>
            <p className="text-sm text-text-secondary max-w-sm">
              Great work, {assignment.employee_name || "there"}. You&apos;ve finished all{" "}
              {totalCount} module{totalCount !== 1 ? "s" : ""} in{" "}
              <span className="text-text-primary font-medium">{track.title}</span>.
            </p>
          </div>
          <div className="w-full max-w-sm bg-surface border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2">
            {modules.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span className="text-sm text-text-secondary">
                  {i + 1}. {m.title}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-surface/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Logo />
            <div className="text-right">
              <p className="text-xs text-text-secondary">Viewing as</p>
              <p className="text-sm font-medium text-text-primary">
                {assignment.employee_name || assignment.employee_email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-text-secondary mb-1.5">
                {track.title} &mdash; {completedCount} of {totalCount} complete
              </p>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar: module list */}
        <aside className="hidden md:flex flex-col gap-1 w-56 shrink-0">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Modules
          </p>
          {modules.map((m, i) => {
            const isActive = i === currentIndex;
            const isDone = !!m.completed_at;
            return (
              <button
                key={m.id}
                onClick={() => setCurrentIndex(i)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-accent/10 border border-accent/20"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : isActive ? (
                    <ChevronRight className="h-4 w-4 text-accent" />
                  ) : (
                    <Circle className="h-4 w-4 text-text-secondary/40" />
                  )}
                </span>
                <span
                  className={`text-xs leading-snug truncate ${
                    isActive ? "text-text-primary font-medium" : "text-text-secondary"
                  }`}
                >
                  {i + 1}. {m.title}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Main: current module */}
        <main className="flex-1 min-w-0">
          {/* Mobile module tabs */}
          <div className="md:hidden flex gap-1.5 overflow-x-auto pb-3 mb-6 -mx-4 px-4">
            {modules.map((m, i) => {
              const isActive = i === currentIndex;
              const isDone = !!m.completed_at;
              return (
                <button
                  key={m.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    isActive
                      ? "bg-accent/10 border-accent/30 text-accent"
                      : isDone
                      ? "bg-white/5 border-white/10 text-text-secondary"
                      : "bg-transparent border-[var(--color-border)] text-text-secondary"
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-3 w-3" />}
                  {i + 1}
                </button>
              );
            })}
          </div>

          <h1 className="text-xl font-bold text-text-primary mb-6">
            {currentModule.title}
          </h1>

          {/* Video */}
          {currentModule.processed_video_url && (
            <div className="mb-8">
              <VideoPlayer
                src={currentModule.processed_video_url}
                vttContent={currentModule.vtt_content || undefined}
                chapters={currentModule.chapters || undefined}
                onProgress={setVideoProgress}
              />
            </div>
          )}

          {/* SOP */}
          {currentModule.sop_content && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
                Standard Operating Procedure
              </h2>
              <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6 max-h-[600px] overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-text-primary mb-4 mt-6 first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold text-text-primary mb-3 mt-5">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold text-text-primary mb-2 mt-4">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-text-secondary mb-3 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 mb-3 text-sm text-text-secondary">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-2 mb-3 text-sm text-text-secondary">{children}</ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-text-primary">{children}</strong>
                    ),
                    hr: () => <hr className="border-[var(--color-border)] my-4" />,
                  }}
                >
                  {currentModule.sop_content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Complete button */}
          <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6 text-center">
            {currentModule.completed_at ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-accent" />
                <p className="text-sm font-semibold text-text-primary">Module Complete</p>
                {currentIndex < modules.length - 1 && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      const next = modules.findIndex((m, i) => i > currentIndex && !m.completed_at);
                      setCurrentIndex(next !== -1 ? next : currentIndex + 1);
                    }}
                  >
                    Next Module
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <h3 className="text-base font-semibold text-text-primary">Mark as Complete</h3>
                <p className="text-sm text-text-secondary max-w-xs">
                  {!canComplete && currentModule.processed_video_url
                    ? "Watch at least 80% of the video to enable this button."
                    : "You've reviewed the material. Click to confirm completion."}
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCompleteModule}
                  loading={completing}
                  disabled={!canComplete}
                  className="mt-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Complete
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
