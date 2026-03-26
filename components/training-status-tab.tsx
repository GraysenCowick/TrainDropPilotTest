"use client";

import { useState, useEffect } from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TrainingRow = {
  completion_id: string;
  module_id: string;
  module_title: string;
  employee_name: string;
  employee_email: string | null;
  status: "pending" | "in_progress" | "completed";
  sent_at: string;
  viewed_at: string | null;
  completed_at: string | null;
  quiz_score: number | null;
  quiz_correct: number;
  quiz_total: number;
};

type SortKey = "employee_name" | "module_title" | "status" | "completed_at" | "quiz_score";
type SortDir = "asc" | "desc";

const STATUS_LABELS: Record<TrainingRow["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_STYLES: Record<TrainingRow["status"], string> = {
  pending: "bg-white/5 text-text-secondary",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  completed: "bg-accent/10 text-accent",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TrainingStatusTab() {
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TrainingRow["status"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("sent_at" as SortKey);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch("/api/training-status")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = rows
    .filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.employee_name.toLowerCase().includes(q) ||
          r.module_title.toLowerCase().includes(q) ||
          (r.employee_email ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let av: string | number | null = a[sortKey as keyof TrainingRow] as string | number | null;
      let bv: string | number | null = b[sortKey as keyof TrainingRow] as string | number | null;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const statusCounts = {
    all: rows.length,
    completed: rows.filter((r) => r.status === "completed").length,
    in_progress: rows.filter((r) => r.status === "in_progress").length,
    pending: rows.filter((r) => r.status === "pending").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">No training assigned yet</p>
        <p className="text-sm text-text-secondary max-w-xs">
          Publish a module and send it to your team to see their progress here.
        </p>
      </div>
    );
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {(["all", "completed", "in_progress", "pending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
              statusFilter === s
                ? "bg-accent text-background border-transparent"
                : "bg-white/5 text-text-secondary border-[var(--color-border)] hover:text-text-primary"
            )}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              statusFilter === s ? "bg-background/20" : "bg-white/10"
            )}>
              {statusCounts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee or module…"
          className="w-full bg-surface border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/[0.02]">
              {(
                [
                  { key: "employee_name", label: "Employee" },
                  { key: "module_title", label: "Module" },
                  { key: "status", label: "Status" },
                  { key: "quiz_score", label: "Score" },
                  { key: "completed_at", label: "Completed" },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide cursor-pointer hover:text-text-primary select-none"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm text-text-secondary">
                  No results match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.completion_id}
                  className="border-b border-[var(--color-border)]/50 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{row.employee_name}</p>
                    {row.employee_email && (
                      <p className="text-xs text-text-secondary">{row.employee_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-text-primary">{row.module_title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_STYLES[row.status])}>
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.quiz_score !== null ? (
                      <span className={cn("font-semibold", row.quiz_score >= 70 ? "text-green-400" : "text-yellow-400")}>
                        {row.quiz_score}%
                        <span className="text-xs font-normal text-text-secondary ml-1">
                          ({row.quiz_correct}/{row.quiz_total})
                        </span>
                      </span>
                    ) : row.quiz_total > 0 ? (
                      <span className="text-xs text-text-secondary">Not attempted</span>
                    ) : (
                      <span className="text-xs text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(row.completed_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-secondary text-right">
        {filtered.length} of {rows.length} assignment{rows.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
