"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeDate } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalModules: number;
  totalTracks: number;
  totalCompletions: number;
  activeToday: number;
}

interface ActivityEvent {
  id: string;
  table_name: string;
  event_type: string;
  payload: Record<string, unknown>;
  description: string;
  priority: string;
  created_at: string;
}

const TABLE_COLORS: Record<string, string> = {
  profiles: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  modules: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  tracks: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  track_modules: "text-blue-300 bg-blue-300/10 border-blue-300/20",
  team_members: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  module_completions: "text-green-400 bg-green-400/10 border-green-400/20",
  track_assignments: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  track_module_completions:
    "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

const EVENT_COLORS: Record<string, string> = {
  INSERT: "text-green-400 bg-green-400/10 border border-green-400/20",
  UPDATE: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  DELETE: "text-red-400 bg-red-400/10 border border-red-400/20",
};

const ALL_TABLES = [
  "profiles",
  "modules",
  "tracks",
  "track_modules",
  "team_members",
  "module_completions",
  "track_assignments",
  "track_module_completions",
];

export default function AdminDashboard({
  initialStats,
  initialEvents,
}: {
  initialStats: AdminStats;
  initialEvents: ActivityEvent[];
}) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [stats, setStats] = useState(initialStats);
  const [isLive, setIsLive] = useState(false);
  const [hasPulse, setHasPulse] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const addEvent = useCallback(
    (event: ActivityEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 200));
      setHasPulse(true);
      setTimeout(() => setHasPulse(false), 1500);

      // Optimistic stat updates
      if (event.event_type === "INSERT") {
        if (event.table_name === "profiles") {
          setStats((s) => ({
            ...s,
            totalUsers: s.totalUsers + 1,
            activeToday: s.activeToday + 1,
          }));
        } else if (event.table_name === "modules") {
          setStats((s) => ({ ...s, totalModules: s.totalModules + 1 }));
        } else if (event.table_name === "tracks") {
          setStats((s) => ({ ...s, totalTracks: s.totalTracks + 1 }));
        }
      }
      if (
        event.table_name === "module_completions" &&
        event.event_type === "UPDATE" &&
        (event.payload?.completed_at as string)
      ) {
        setStats((s) => ({
          ...s,
          totalCompletions: s.totalCompletions + 1,
        }));
      }
    },
    []
  );

  useEffect(() => {
    const channel = supabase
      .channel("admin-mission-control")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "admin_event_log" },
        (payload: any) => {
          addEvent(payload.new as ActivityEvent);
        }
      )
      .subscribe((status: string) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, addEvent]);

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter((event) => {
    if (filterTable !== "all" && event.table_name !== filterTable) return false;
    if (filterEvent !== "all" && event.event_type !== filterEvent) return false;
    if (
      search &&
      !event.description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statCards = [
    {
      label: "Users",
      value: stats.totalUsers,
      color: "text-violet-400",
      dot: "bg-violet-400",
    },
    {
      label: "Modules",
      value: stats.totalModules,
      color: "text-cyan-400",
      dot: "bg-cyan-400",
    },
    {
      label: "Tracks",
      value: stats.totalTracks,
      color: "text-blue-400",
      dot: "bg-blue-400",
    },
    {
      label: "Completions",
      value: stats.totalCompletions,
      color: "text-green-400",
      dot: "bg-green-400",
    },
    {
      label: "Active Today",
      value: stats.activeToday,
      color: "text-amber-400",
      dot: "bg-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-cyan-400 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-zinc-950 font-bold text-xs">TD</span>
          </div>
          <span className="font-semibold text-sm text-zinc-100">TrainDrop</span>
          <span className="text-zinc-600 text-sm">/</span>
          <span className="text-zinc-400 text-sm font-medium">
            Mission Control
          </span>
        </div>

        <div className="flex items-center gap-5">
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isLive ? "bg-green-400 animate-pulse" : "bg-zinc-600"
              }`}
            />
            <span
              className={`text-xs font-mono font-semibold tracking-widest ${
                isLive ? "text-green-400" : "text-zinc-600"
              }`}
            >
              {isLive ? "LIVE" : "CONNECTING"}
            </span>
          </div>

          <a
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Manager dashboard →
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-3">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className={`text-3xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                <span className="text-zinc-500 text-xs">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-44 transition-colors"
          />

          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="all">All tables</option>
            {ALL_TABLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="all">All events</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              autoScroll
                ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}
          >
            {autoScroll ? "⬆ Auto-scroll on" : "⬆ Auto-scroll off"}
          </button>

          <span className="text-zinc-600 text-xs ml-auto">
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Activity feed */}
        <div
          ref={feedRef}
          className={`space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 transition-all duration-300 ${
            hasPulse ? "ring-1 ring-cyan-400/25 rounded-xl" : ""
          }`}
        >
          {filteredEvents.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
              <p className="text-zinc-600 text-sm">No events yet.</p>
              <p className="text-zinc-700 text-xs mt-1">
                Waiting for activity from Jason...
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`bg-zinc-900 border rounded-xl px-4 py-3 transition-colors hover:border-zinc-700 ${
                  event.priority === "high"
                    ? "border-amber-500/30"
                    : "border-zinc-800"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Event badge */}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                      EVENT_COLORS[event.event_type] ||
                      "text-zinc-400 bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    {event.event_type}
                  </span>

                  {/* Table badge */}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${
                      TABLE_COLORS[event.table_name] ||
                      "text-zinc-400 bg-zinc-800 border-zinc-700"
                    }`}
                  >
                    {event.table_name}
                  </span>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-snug">
                      {event.description ||
                        `${event.event_type} on ${event.table_name}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-zinc-600">
                        {formatRelativeDate(event.created_at)}
                      </span>
                      {event.priority === "high" && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded font-semibold">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Raw toggle */}
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors shrink-0 mt-0.5 font-mono"
                  >
                    {expandedIds.has(event.id) ? "▲ hide" : "▼ raw"}
                  </button>
                </div>

                {/* Raw payload */}
                {expandedIds.has(event.id) && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <pre className="text-[11px] text-zinc-500 overflow-x-auto bg-zinc-950 rounded-lg p-3 max-h-52 leading-relaxed">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
