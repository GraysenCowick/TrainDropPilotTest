"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Edit3 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SOPEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  loading?: boolean;
}

export function SOPEditor({ value, onChange, readOnly = false, loading = false }: SOPEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 bg-surface border border-[var(--color-border)] rounded-lg p-1 w-fit">
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              mode === "edit"
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => setMode("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              mode === "preview"
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      )}

      {/* Content */}
      {(mode === "edit" && !readOnly) ? (
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "min-h-[400px] font-mono text-xs leading-relaxed transition-opacity duration-300",
              loading && "opacity-30 pointer-events-none select-none"
            )}
            placeholder="Your SOP content (Markdown supported)..."
          />
          {loading && <SOPLoadingOverlay />}
        </div>
      ) : (
        <div className="relative">
        <div className={cn(
          "bg-surface border border-[var(--color-border)] rounded-lg p-6 min-h-[400px] transition-opacity duration-300",
          loading && "opacity-30 pointer-events-none select-none"
        )}>
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
                <ul className="list-disc list-inside space-y-1.5 mb-3 text-sm text-text-secondary">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1.5 mb-3 text-sm text-text-secondary">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              code: ({ children }) => (
                <code className="bg-white/5 border border-[var(--color-border)] rounded px-1.5 py-0.5 text-xs font-mono text-accent">
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-accent/40 pl-4 my-3 text-sm text-text-secondary italic">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="border-[var(--color-border)] my-4" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-text-primary">
                  {children}
                </strong>
              ),
            }}
          >
            {value || "*No SOP content yet.*"}
          </ReactMarkdown>
        </div>
        {loading && <SOPLoadingOverlay />}
        </div>
      )}
    </div>
  );
}

function SOPLoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg">
      {/* Skeleton lines */}
      <div className="w-full px-6 flex flex-col gap-3">
        <div className="h-5 w-2/5 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-full bg-white/8 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-white/8 rounded animate-pulse" />
        <div className="h-3 w-4/5 bg-white/8 rounded animate-pulse" />
        <div className="h-3 w-full bg-white/8 rounded animate-pulse" />
        <div className="mt-3 h-4 w-1/3 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-full bg-white/8 rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-white/8 rounded animate-pulse" />
        <div className="h-3 w-full bg-white/8 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-white/8 rounded animate-pulse" />
      </div>
      {/* Spinner + label */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/80 border border-[var(--color-border)] rounded-full backdrop-blur-sm">
        <div className="h-3.5 w-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
        <span className="text-xs text-text-secondary">Regenerating SOP…</span>
      </div>
    </div>
  );
}
