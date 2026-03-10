"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface ModuleInfo {
  id: string;
  title: string;
}

interface AssignmentRow {
  id: string;
  employee_name: string | null;
  employee_email: string;
  assigned_at: string;
  completed_at: string | null;
  track_module_completions: Array<{ module_id: string; completed_at: string }>;
}

interface TrackStatusData {
  assignments: AssignmentRow[];
  modules: ModuleInfo[];
  totalModules: number;
}

export function TrackCompletionStatus({ trackId }: { trackId: string }) {
  const [data, setData] = useState<TrackStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tracks/${trackId}/team-status`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [trackId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-7 w-7 text-text-secondary opacity-30 mb-2" />
        <p className="text-sm text-text-secondary">No employees have been sent this track yet.</p>
        <p className="text-xs text-text-secondary opacity-60 mt-1">
          Use the &quot;Send to Team&quot; button above to invite employees.
        </p>
      </div>
    );
  }

  const { assignments, modules, totalModules } = data;
  const fullyCompleted = assignments.filter((a) => a.completed_at).length;
  const pending = assignments.length - fullyCompleted;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Completed", value: fullyCompleted, color: "text-accent", bg: "bg-accent/10" },
          { label: "Pending", value: pending, color: "text-text-secondary", bg: "bg-white/5" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-lg px-3 py-3 text-center`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Employee rows */}
      <div className="flex flex-col gap-2">
        {assignments.map((row) => {
          const completedModuleIds = new Set(row.track_module_completions.map((c) => c.module_id));
          const modulesDone = completedModuleIds.size;
          const isFullyDone = !!row.completed_at;
          const isOpen = expanded === row.id;

          return (
            <div
              key={row.id}
              className="bg-surface border border-[var(--color-border)] rounded-lg overflow-hidden"
            >
              {/* Row header */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
                onClick={() => setExpanded(isOpen ? null : row.id)}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isFullyDone ? "bg-accent/10 text-accent" : "bg-white/5 text-text-secondary"
                  }`}
                >
                  {isFullyDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {row.employee_name || row.employee_email}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {isFullyDone
                      ? `Completed ${formatRelativeDate(row.completed_at!)}`
                      : `Sent ${formatRelativeDate(row.assigned_at)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Module progress bar */}
                  {totalModules > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-secondary">
                        {modulesDone}/{totalModules}
                      </span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${(modulesDone / totalModules) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isFullyDone
                        ? "bg-accent/10 text-accent"
                        : "bg-white/10 text-text-secondary"
                    }`}
                  >
                    {isFullyDone ? "Done" : "Pending"}
                  </span>
                </div>
              </button>

              {/* Expanded: per-module status */}
              {isOpen && modules.length > 0 && (
                <div className="border-t border-[var(--color-border)] px-4 py-3 flex flex-col gap-1.5">
                  {modules.map((mod, i) => {
                    const done = completedModuleIds.has(mod.id);
                    return (
                      <div key={mod.id} className="flex items-center gap-2.5">
                        <span className="text-xs text-text-secondary w-4 text-center shrink-0">
                          {i + 1}
                        </span>
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-text-secondary/40 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            done ? "text-text-primary" : "text-text-secondary"
                          }`}
                        >
                          {mod.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
