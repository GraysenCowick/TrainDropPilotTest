"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Video, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatRelativeDate, truncate } from "@/lib/utils";
import type { Module as BaseModule } from "@/lib/supabase/types";

type Module = BaseModule & {
  completion_count?: number;
  assignment_count?: number;
};

interface ModuleCardProps {
  module: Module;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const completionPercent =
    module.assignment_count && module.assignment_count > 0
      ? Math.round(
          ((module.completion_count || 0) / module.assignment_count) * 100
        )
      : null;

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/modules/${module.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteDialogOpen(false);
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="relative group">
      <Link href={`/dashboard/modules/${module.id}`}>
        <Card hover className="h-full flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-[var(--color-border)] flex items-center justify-center shrink-0">
                {module.input_type === "video" ? (
                  <Video className="h-4 w-4 text-text-secondary" />
                ) : (
                  <FileText className="h-4 w-4 text-text-secondary" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-text-primary leading-tight truncate">
                {truncate(module.title, 40)}
              </h3>
            </div>
            <StatusBadge status={module.status} />
          </div>

          {/* SOP preview */}
          {module.sop_content && (
            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {truncate(module.sop_content.replace(/[#*`]/g, ""), 100)}
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto flex flex-col gap-2">
            {/* Completion progress */}
            {module.status === "published" &&
              (module.assignment_count ?? 0) > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">
                      Completions
                    </span>
                    <span className="text-xs text-text-secondary tabular-nums">
                      {module.completion_count || 0}/{module.assignment_count}
                    </span>
                  </div>
                  <Progress value={completionPercent || 0} size="sm" />
                </div>
              )}

            {/* Date */}
            <p className="text-xs text-text-secondary">
              {formatRelativeDate(module.created_at)}
            </p>
          </div>
        </Card>
      </Link>

      {/* Delete button — appears on hover */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDeleteDialogOpen(true);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-surface border border-[var(--color-border)] text-text-secondary hover:text-red-400 hover:border-red-500/30 z-10"
        title="Delete module"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Delete confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Module"
        description="This will permanently delete this module and all its completions. This action cannot be undone."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={deleting}>
            Delete Module
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
