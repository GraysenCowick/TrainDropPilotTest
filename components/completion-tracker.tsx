"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Plus, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeDate } from "@/lib/utils";

interface Completion {
  id: string;
  employee_name: string;
  employee_email: string | null;
  completed_at: string;
}

interface Assignment {
  id: string;
  employee_email: string;
  assigned_at: string;
}

interface CompletionTrackerProps {
  moduleId: string;
}

export function CompletionTracker({ moduleId }: CompletionTrackerProps) {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, [moduleId]);

  async function fetchData() {
    setFetching(true);
    const res = await fetch(`/api/modules/${moduleId}/completions`);
    if (res.ok) {
      const data = await res.json();
      setCompletions(data.completions);
      setAssignments(data.assignments);
    }
    setFetching(false);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setLoading(true);
    const res = await fetch(`/api/modules/${moduleId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_email: newEmail }),
    });

    if (res.ok) {
      setNewEmail("");
      await fetchData();
    }
    setLoading(false);
  }

  async function handleUnassign(email: string) {
    await fetch(
      `/api/modules/${moduleId}/assign?email=${encodeURIComponent(email)}`,
      { method: "DELETE" }
    );
    await fetchData();
  }

  // Build list: assigned employees merged with completions
  const assignedEmails = new Set(assignments.map((a) => a.employee_email));
  const completionsByEmail = new Map(
    completions
      .filter((c) => c.employee_email)
      .map((c) => [c.employee_email!, c])
  );

  // Unassigned completions (people who completed without being assigned)
  const unassignedCompletions = completions.filter(
    (c) => !c.employee_email || !assignedEmails.has(c.employee_email)
  );

  if (fetching) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 bg-white/5 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add employee */}
      <form onSubmit={handleAssign} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="employee@company.com"
          />
        </div>
        <Button type="submit" variant="secondary" size="md" loading={loading}>
          <Plus className="h-4 w-4" />
          Assign
        </Button>
      </form>

      {/* Assigned employees */}
      {assignments.length === 0 && unassignedCompletions.length === 0 ? (
        <div className="text-center py-8 text-sm text-text-secondary">
          <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No employees assigned yet. Add emails above.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map((assignment) => {
            const completion = completionsByEmail.get(assignment.employee_email);
            return (
              <div
                key={assignment.id}
                className="flex items-center gap-3 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-lg"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    completion
                      ? "bg-accent/10 text-accent"
                      : "bg-white/5 text-text-secondary"
                  }`}
                >
                  {completion ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {assignment.employee_email}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {completion
                      ? `Completed ${formatRelativeDate(completion.completed_at)}`
                      : "Pending"}
                  </p>
                </div>
                <button
                  onClick={() => handleUnassign(assignment.employee_email)}
                  className="text-text-secondary hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {/* Unassigned completions */}
          {unassignedCompletions.map((completion) => (
            <div
              key={completion.id}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-lg"
            >
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{completion.employee_name}</p>
                <p className="text-xs text-text-secondary">
                  {completion.employee_email || "No email"} ·{" "}
                  {formatRelativeDate(completion.completed_at)}
                </p>
              </div>
              <span className="text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-md">
                Unassigned
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
