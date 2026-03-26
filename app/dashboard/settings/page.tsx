"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [userId, setUserId] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: rawProfile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .single();

      const profile = rawProfile as { business_name: string | null } | null;
      setBusinessName(profile?.business_name || "");
      setLoadingProfile(false);
    }
    loadProfile();
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ business_name: businessName.trim() || null })
      .eq("id", userId);

    if (error) {
      toast("Failed to save profile", "error");
    } else {
      toast("Profile saved", "success");
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast(error.message, "error");
    } else {
      toast("Password updated", "success");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  async function handleBugReport(e: React.FormEvent) {
    e.preventDefault();
    if (!bugDescription.trim()) return;
    setSubmittingBug(true);
    const res = await fetch("/api/bug-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: bugDescription }),
    });
    if (res.ok) {
      setBugSubmitted(true);
      setBugDescription("");
    } else {
      toast("Failed to send bug report. Please try again.", "error");
    }
    setSubmittingBug(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "Failed to delete account", "error");
      setDeleting(false);
      return;
    }
    router.push("/");
  }

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-5 w-32 bg-white/5 rounded animate-pulse mb-8" />
        <div className="h-8 w-28 bg-white/5 rounded animate-pulse mb-8" />
        <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6 mb-6 flex flex-col gap-4">
          <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6 mb-6 flex flex-col gap-4">
          <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-8">Settings</h1>

      {/* Profile */}
      <section className="bg-surface border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Profile</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <Input
            label="Email"
            value={email}
            disabled
            hint="Email cannot be changed"
          />
          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Acme Cleaning Co."
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Save Profile
            </Button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="bg-surface border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingPassword}
              disabled={!newPassword || !confirmPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </section>

      {/* Report a Bug */}
      <section className="bg-surface border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Report a Bug</h2>
        <p className="text-xs text-text-secondary mb-4">
          Found something broken? Describe the issue and we&apos;ll look into it.
        </p>
        {bugSubmitted ? (
          <div className="flex items-center gap-2 text-sm text-accent">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Bug report sent. Thanks for the feedback!
          </div>
        ) : (
          <form onSubmit={handleBugReport} className="flex flex-col gap-3">
            <textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Describe what happened and how to reproduce it…"
              rows={4}
              className="w-full bg-background border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submittingBug}
                disabled={!bugDescription.trim()}
              >
                Send Report
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Danger zone */}
      <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-text-secondary mb-4">
          Deleting your account will permanently remove all your modules and
          data. This cannot be undone.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete Account
        </Button>
      </section>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteConfirmText(""); }}
        title="Delete Account"
        description="This will permanently delete your account and all training modules. This cannot be undone."
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-text-secondary mb-2">
              Type <span className="font-mono font-semibold text-text-primary">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-background border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-red-500/30"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={deleteConfirmText !== "DELETE"}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
