"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Users, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { TeamMember } from "@/lib/supabase/types";

export function TeamTab() {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) {
      setMembers(await res.json());
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) return;
    setAdding(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName, email: addEmail }),
    });
    if (res.ok) {
      setAddName("");
      setAddEmail("");
      await fetchMembers();
      toast("Employee added", "success");
    } else {
      const err = await res.json();
      toast(err.error || "Failed to add employee", "error");
    }
    setAdding(false);
  }

  function startEdit(member: TeamMember) {
    setEditingId(member.id);
    setEditName(member.name);
    setEditEmail(member.email);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, email: editEmail }),
    });
    if (res.ok) {
      cancelEdit();
      await fetchMembers();
      toast("Employee updated", "success");
    } else {
      toast("Failed to update employee", "error");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/team/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteTarget(null);
      await fetchMembers();
      toast("Employee removed", "success");
    } else {
      toast("Failed to remove employee", "error");
    }
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-surface border border-[var(--color-border)] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add employee form */}
      <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Add Employee</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Full name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              type="email"
              placeholder="Email address"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={adding}
            disabled={!addName.trim() || !addEmail.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </div>

      {/* Employee list */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Team Members ({members.length})
        </h2>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--color-border)] rounded-xl">
            <Users className="h-8 w-8 text-text-secondary opacity-40 mb-3" />
            <p className="text-sm text-text-secondary">No team members yet.</p>
            <p className="text-xs text-text-secondary mt-1 opacity-60">
              Add employees above to start sending training modules.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((member) =>
              editingId === member.id ? (
                /* Edit row */
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 bg-surface border border-accent/40 rounded-lg"
                >
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSaveEdit(member.id)}
                      disabled={saving}
                      className="p-1.5 rounded-md text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-md text-text-secondary hover:bg-white/5 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Display row */
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 bg-surface border border-[var(--color-border)] rounded-lg group"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-accent">
                      {member.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-text-secondary truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => startEdit(member)}
                      className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(member)}
                      className="p-1.5 rounded-md text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Employee"
        description={`Are you sure you want to remove ${deleteTarget?.name} from your team? Their completion records will be preserved.`}
      >
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={deleting}>
            Remove
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
