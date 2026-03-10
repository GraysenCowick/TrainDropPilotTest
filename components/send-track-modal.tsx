"use client";

import { useState, useEffect } from "react";
import { Mail, Users, Check } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { TeamMember } from "@/lib/supabase/types";

interface SendTrackModalProps {
  open: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

export function SendTrackModal({ open, onClose, trackId, trackTitle }: SendTrackModalProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      fetchMembers();
    }
  }, [open]);

  async function fetchMembers() {
    setLoadingMembers(true);
    const res = await fetch("/api/team");
    if (res.ok) setMembers(await res.json());
    setLoadingMembers(false);
  }

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m.id)));
    }
  }

  async function handleSend() {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tracks/${trackId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_member_ids: Array.from(selected), send_email: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to send emails", "error");
      } else {
        const sent = data.sent ?? 0;
        toast(`Track sent to ${sent} employee${sent !== 1 ? "s" : ""}`, "success");
        onClose();
      }
    } catch {
      toast("Network error. Please try again.", "error");
    }
    setSending(false);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Send Track to Team"
      description={`Send "${trackTitle}" to selected employees. Each person receives a unique tracking link.`}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {loadingMembers ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-8 w-8 text-text-secondary opacity-40 mb-2" />
            <p className="text-sm text-text-secondary">No team members yet.</p>
            <p className="text-xs text-text-secondary opacity-60 mt-1">
              Add employees from the Team tab on your dashboard.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                {selected.size} of {members.length} selected
              </span>
              <button
                onClick={toggleAll}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                {selected.size === members.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    selected.has(member.id) ? "bg-accent border-accent" : "border-[var(--color-border)]"
                  }`}>
                    {selected.has(member.id) && <Check className="h-2.5 w-2.5 text-background" />}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-accent">
                      {member.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                    <p className="text-xs text-text-secondary truncate">{member.email}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--color-border)]">
              <Button
                variant="primary"
                size="md"
                onClick={handleSend}
                loading={sending}
                disabled={selected.size === 0}
                className="w-full"
              >
                <Mail className="h-4 w-4" />
                Send to {selected.size > 0 ? `${selected.size} Employee${selected.size !== 1 ? "s" : ""}` : "Team"}
              </Button>
            </div>
            <p className="text-xs text-text-secondary text-center">
              Each employee receives a unique link to track their progress through this track.
            </p>
          </>
        )}
      </div>
    </Dialog>
  );
}
