"use client";

import { useState, useEffect } from "react";
import { Mail, Link as LinkIcon, Check, Users } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { TeamMember } from "@/lib/supabase/types";

interface SendToTeamModalProps {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  moduleSlug: string;
}

export function SendToTeamModal({ open, onClose, moduleId, moduleSlug }: SendToTeamModalProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  async function fetchMembers() {
    setLoadingMembers(true);
    const res = await fetch("/api/team");
    if (res.ok) {
      setMembers(await res.json());
    }
    setLoadingMembers(false);
  }

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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

  async function handleSendEmail() {
    if (selected.size === 0) return;
    setSending(true);

    let data: { sent?: number; total?: number; error?: string } = {};
    try {
      const res = await fetch(`/api/modules/${moduleId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_member_ids: Array.from(selected),
          send_email: true,
        }),
      });

      data = await res.json();

      if (!res.ok) {
        toast(data.error || "Failed to send emails. Please try again.", "error");
        setSending(false);
        return;
      }
    } catch {
      toast("Network error. Please check your connection and try again.", "error");
      setSending(false);
      return;
    }

    const sent = data.sent ?? 0;
    const total = data.total ?? selected.size;

    if (sent === 0) {
      toast("Emails failed to send. Check your email configuration.", "error");
    } else if (sent < total) {
      toast(`Sent to ${sent} of ${total} employees. Some failed.`, "info");
      onClose();
    } else {
      toast(`Email sent to ${sent} employee${sent !== 1 ? "s" : ""}`, "success");
      onClose();
    }
    setSending(false);
  }

  function handleCopyLink() {
    const appUrl = window.location.origin;
    const link = `${appUrl}/m/${moduleSlug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast("Link copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Send to Team"
      description="Choose employees to send this training module to."
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
            {/* Select all */}
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

            {/* Member list */}
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  {/* Checkbox */}
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    selected.has(member.id)
                      ? "bg-accent border-accent"
                      : "border-[var(--color-border)]"
                  }`}>
                    {selected.has(member.id) && (
                      <Check className="h-2.5 w-2.5 text-background" />
                    )}
                  </div>
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
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
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[var(--color-border)]">
              <Button
                variant="primary"
                size="md"
                onClick={handleSendEmail}
                loading={sending}
                disabled={selected.size === 0}
                className="flex-1"
              >
                <Mail className="h-4 w-4" />
                Send via Email ({selected.size})
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyLink}
                className="flex-1"
              >
                {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
            <p className="text-xs text-text-secondary text-center">
              Email sends unique tracking links. Copy Link shares the general module URL.
            </p>
          </>
        )}

        {members.length === 0 && (
          <Button variant="secondary" onClick={handleCopyLink} className="w-full">
            {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Module Link"}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
