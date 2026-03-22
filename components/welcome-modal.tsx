"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Video, Wand2, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const STORAGE_KEY = "traindrop_welcome_seen";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  const steps = [
    {
      icon: <Video className="h-4 w-4 text-accent" />,
      title: "Record or type it out",
      desc: "Film yourself doing the task on your phone, or paste your rough notes. Unscripted is fine.",
    },
    {
      icon: <Wand2 className="h-4 w-4 text-accent" />,
      title: "AI builds the training module",
      desc: "TrainDrop transcribes your video, writes a clean step-by-step SOP, and adds captions. Ready in minutes.",
    },
    {
      icon: <Send className="h-4 w-4 text-accent" />,
      title: "Send it. See who finishes.",
      desc: "Email your team a unique link. No employee accounts needed — they just click and complete.",
    },
  ];

  return (
    <Dialog open={open} onClose={dismiss} title="Welcome to TrainDrop" className="max-w-lg">
      <p className="text-sm text-text-secondary mb-5 -mt-1">
        Here&apos;s how it works — you&apos;ll have your first module ready in under 5 minutes.
      </p>
      <div className="flex flex-col gap-3 mb-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-background border border-[var(--color-border)] rounded-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{step.title}</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/modules/new" className="flex-1" onClick={dismiss}>
          <Button variant="primary" size="md" className="w-full">
            <ArrowRight className="h-4 w-4" />
            Create My First Module
          </Button>
        </Link>
        <Button variant="ghost" size="md" onClick={dismiss}>
          Explore first
        </Button>
      </div>
    </Dialog>
  );
}
