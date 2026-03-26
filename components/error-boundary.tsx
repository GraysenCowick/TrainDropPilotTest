"use client";

import { Component, ReactNode, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// ── Fallback UI ───────────────────────────────────────────────────────────────

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReport() {
    setSending(true);
    try {
      await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorMessage: error?.message ?? "Unknown error",
          stackTrace: error?.stack ?? null,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          note: note.trim() || null,
        }),
      });
      setSent(true);
    } catch {
      setSent(true); // Still show confirmation even if fetch fails
    }
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface border border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">Something went wrong</h2>
          <p className="text-sm text-text-secondary">
            An unexpected error occurred. You can report this issue or try reloading the page.
          </p>
        </div>

        {error?.message && (
          <p className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 w-full text-left font-mono break-all">
            {error.message}
          </p>
        )}

        {!sent ? (
          <div className="w-full flex flex-col gap-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional: describe what you were doing when this happened…"
              rows={3}
              className="w-full bg-background border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <div className="flex gap-2">
              <button
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={handleReport}
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {sending ? "Sending…" : "Report Bug"}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <p className="text-sm text-accent">
              Report sent. Thanks — we&apos;ll look into it.
            </p>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Error Boundary class ──────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
