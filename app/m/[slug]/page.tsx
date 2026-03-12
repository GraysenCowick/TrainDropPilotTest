"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/video-player";
import { createClient } from "@/lib/supabase/client";
import type { Module } from "@/lib/supabase/types";

const EMPLOYEE_COOKIE = "td_employee";

function getEmployeeFromCookie(): { name: string; email: string } | null {
  try {
    const raw = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith(EMPLOYEE_COOKIE + "="));
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

function setEmployeeCookie(name: string, email: string) {
  const value = JSON.stringify({ name, email });
  document.cookie = `${EMPLOYEE_COOKIE}=${encodeURIComponent(value)}; max-age=${60 * 60 * 24 * 30}; path=/; SameSite=Lax`;
}

export default function PublicModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [module, setModule] = useState<Module | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  // Employee modal
  const [showModal, setShowModal] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employee, setEmployee] = useState<{ name: string; email: string } | null>(null);

  // Completion gate
  const [videoProgress, setVideoProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  // Time tracking
  const startTimeRef = useRef<number>(Date.now());

  const canComplete = (!module?.processed_video_url || videoProgress >= 80) && !completed;

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase
        .from("modules")
        .select("*")
        .eq("share_slug", slug)
        .eq("status", "published")
        .single();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setModule(data);

      // If we have a token, fetch employee info from the server
      if (token) {
        const res = await fetch(`/api/modules/${data.id}/track-view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          const completion = await res.json();
          if (completion.team_members) {
            const member = completion.team_members;
            setEmployee({ name: member.name, email: member.email });
            setEmployeeCookie(member.name, member.email);
            // If already completed, mark as done
            if (completion.completed_at) {
              setCompleted(true);
              setCompletedAt(completion.completed_at);
            }
          }
        } else {
          // Invalid token — fall through to normal flow
          const cached = getEmployeeFromCookie();
          if (cached) {
            setEmployee(cached);
          } else {
            setShowModal(true);
          }
        }
      } else {
        // No token — use cookie or show modal
        const cached = getEmployeeFromCookie();
        if (cached) {
          setEmployee(cached);
        } else {
          setShowModal(true);
        }
      }

      setLoading(false);
    }

    init();
  }, [slug, token]); // eslint-disable-line react-hooks/exhaustive-deps


  function handleEmployeeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeName.trim()) return;
    setEmployeeCookie(employeeName, employeeEmail);
    setEmployee({ name: employeeName, email: employeeEmail });
    setShowModal(false);
  }

  async function handleComplete() {
    if (!module || !employee) return;
    setCompleting(true);

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const res = await fetch(`/api/modules/${module.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_name: employee.name,
        employee_email: employee.email || null,
        unique_token: token || null,
        time_spent_seconds: timeSpent,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setCompleted(true);
      setCompletedAt(data.completed_at ?? new Date().toISOString());
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

  if (notFound || !module) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-text-secondary" />
        <h1 className="text-xl font-semibold text-text-primary">
          Training not found
        </h1>
        <p className="text-sm text-text-secondary max-w-xs">
          This training link may have expired or been unpublished.
        </p>
      </div>
    );
  }

  const chapters = module.chapters as unknown as Array<{
    title: string;
    start_time: number;
    summary: string;
  }> | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-surface/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo />
          {employee && (
            <div className="text-right">
              <p className="text-xs text-text-secondary">Viewing as</p>
              <p className="text-sm font-medium text-text-primary">
                {employee.name}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          {module.title}
        </h1>

        {/* Video (if video module with processed video) */}
        {module.processed_video_url && (
          <div className="mb-8">
            <VideoPlayer
              src={module.processed_video_url}
              vttContent={module.vtt_content || undefined}
              chapters={chapters || undefined}
              onProgress={setVideoProgress}
            />
          </div>
        )}

        {/* SOP content */}
        {module.sop_content && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
              Standard Operating Procedure
            </h2>
            <div
              className="bg-surface border border-[var(--color-border)] rounded-xl p-6"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-text-primary mb-4 mt-6 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-text-primary mb-3 mt-5">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-text-primary mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-3 text-sm text-text-secondary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-3 text-sm text-text-secondary">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-text-primary">
                      {children}
                    </strong>
                  ),
                  hr: () => <hr className="border-[var(--color-border)] my-4" />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="border-b border-[var(--color-border)]">{children}</thead>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="border-b border-[var(--color-border)]/50">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left font-semibold text-text-primary whitespace-nowrap">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-text-secondary">{children}</td>
                  ),
                }}
              >
                {module.sop_content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Mark complete */}
        <div className="bg-surface border border-[var(--color-border)] rounded-xl p-6 text-center">
          {completed ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Training Complete!
              </h3>
              <p className="text-sm text-text-secondary">
                Great work, {employee?.name}. Your completion has been recorded.
              </p>
              {completedAt && (
                <p className="text-xs text-text-secondary opacity-60">
                  Completed {new Date(completedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-base font-semibold text-text-primary">
                Mark as Complete
              </h3>
              <p className="text-sm text-text-secondary max-w-xs">
                {!canComplete && module.processed_video_url
                  ? "Watch at least 80% of the video above to enable this button."
                  : "You've reviewed the material. Click to confirm completion."}
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleComplete}
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
        </div>
      </main>

      {/* Employee name modal */}
      <Dialog
        open={showModal}
        onClose={() => {}}
        title="Who are you?"
        description={
          token
            ? "Enter your name so your manager can track your training completion."
            : "Enter your name and email so your manager can track your completion."
        }
      >
        <form onSubmit={handleEmployeeSubmit} className="flex flex-col gap-4">
          <Input
            label="Your Name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Jane Smith"
            required
            autoFocus
          />
          <Input
            label={token ? "Email (optional)" : "Email"}
            type="email"
            value={employeeEmail}
            onChange={(e) => setEmployeeEmail(e.target.value)}
            placeholder="jane@company.com"
            required={!token}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!employeeName.trim() || (!token && !employeeEmail.trim())}
          >
            Start Training
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
