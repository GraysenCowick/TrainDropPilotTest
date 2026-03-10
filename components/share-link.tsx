"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/constants";

interface ShareLinkProps {
  slug: string;
}

export function ShareLink({ slug }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const url = `${APP_URL}/m/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        Share Link
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center bg-surface border border-[var(--color-border)] rounded-lg px-3 py-2.5 gap-2 min-w-0">
          <span className="text-xs text-accent font-mono truncate">{url}</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
      <p className="text-xs text-text-secondary">
        Share this link with your employees — no login required.
      </p>
    </div>
  );
}
