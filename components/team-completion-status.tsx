"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Timer } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface ModuleCompletionRow {
  id: string;
  module_id: string;
  team_member_id: string;
  unique_token: string;
  sent_at: string;
  viewed_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number | null;
  team_members: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeamCompletionStatusProps {
  moduleId: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function TeamCompletionStatus({ moduleId }: TeamCompletionStatusProps) {
  const [rows, setRows] = useState<ModuleCompletionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStatus();
  }, [moduleId]);

  async function fetchStatus() {
    setLoading(true);
    const res = await fetch(`/api/modules/${moduleId}/team-status`);
    if (res.ok) {
      setRows(await res.json());
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-7 w-7 text-text-secondary opacity-30 mb-2" />
        <p className="text-sm text-text-secondary">No employees have been sent this module yet.</p>
        <p className="text-xs text-text-secondary opacity-60 mt-1">
          Use the &quot;Send to Team&quot; button above to invite employees.
        </p>
      </div>
    );
  }

  const completed = rows.filter((r) => r.completed_at).length;
  const pending = rows.length - completed;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Completed", value: completed, color: "text-accent", bg: "bg-accent/10" },
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
        {rows.map((row) => {
          const isCompleted = !!row.completed_at;

          return (
            <div
              key={row.id}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-lg"
            >
              {/* Status icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted ? "bg-accent/10 text-accent" : "bg-white/5 text-text-secondary"
              }`}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {row.team_members.name}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {isCompleted
                    ? `Completed ${formatRelativeDate(row.completed_at!)}`
                    : `Sent ${formatRelativeDate(row.sent_at)}`}
                </p>
              </div>

              {/* Time spent + status badge */}
              <div className="flex items-center gap-2 shrink-0">
                {isCompleted && row.time_spent_seconds !== null && (
                  <div className="flex items-center gap-1 text-xs text-text-secondary">
                    <Timer className="h-3 w-3" />
                    {formatDuration(row.time_spent_seconds)}
                  </div>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isCompleted ? "bg-accent/10 text-accent" : "bg-white/10 text-text-secondary"
                }`}>
                  {isCompleted ? "Completed" : "Pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
