"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Wand2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ModuleStatus } from "@/lib/supabase/types";

interface ProcessingStatusProps {
  moduleId: string;
  inputType: "text" | "video";
  onComplete?: () => void;
}

interface Step {
  icon: React.ReactNode;
  label: string;
  description: string;
}

export function ProcessingStatus({
  moduleId,
  inputType,
  onComplete,
}: ProcessingStatusProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] =
    inputType === "text"
      ? [
          {
            icon: <FileText className="h-4 w-4" />,
            label: "Parsing notes",
            description: "Reading your raw notes",
          },
          {
            icon: <Wand2 className="h-4 w-4" />,
            label: "Generating SOP",
            description: "Claude is writing your procedure",
          },
          {
            icon: <CheckCircle2 className="h-4 w-4" />,
            label: "Finishing up",
            description: "Almost ready",
          },
        ]
      : [
          {
            icon: <FileText className="h-4 w-4" />,
            label: "Transcribing video",
            description: "Converting speech to text with Whisper",
          },
          {
            icon: <Wand2 className="h-4 w-4" />,
            label: "Analyzing content",
            description: "Claude is building your SOP",
          },
          {
            icon: <Loader2 className="h-4 w-4" />,
            label: "Generating captions",
            description: "Creating subtitles from transcription",
          },
          {
            icon: <CheckCircle2 className="h-4 w-4" />,
            label: "Finishing up",
            description: "Almost ready",
          },
        ];

  // Animate through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, inputType === "text" ? 3000 : 6000);
    return () => clearInterval(interval);
  }, [steps.length, inputType]);

  // Subscribe to Supabase Realtime for status changes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`module-${moduleId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "modules",
          filter: `id=eq.${moduleId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status as ModuleStatus;
          if (newStatus === "ready" || newStatus === "published") {
            onComplete ? onComplete() : router.refresh();
          }
        }
      )
      .subscribe();

    // Also poll every 5 seconds as fallback
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("modules")
        .select("status")
        .eq("id", moduleId)
        .single();

      const row = data as { status: ModuleStatus } | null;
      if (row?.status === "ready" || row?.status === "published") {
        onComplete ? onComplete() : router.refresh();
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [moduleId, router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <div className="absolute inset-[6px] rounded-full bg-accent/10 flex items-center justify-center">
          <Wand2 className="h-5 w-5 text-accent" />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-2">
        Processing your module
      </h2>
      <p className="text-sm text-text-secondary mb-10 max-w-xs">
        {inputType === "text"
          ? "Claude is generating your SOP. This usually takes 15–30 seconds."
          : "This takes 2–5 minutes for video processing. Feel free to come back later."}
      </p>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-full max-w-xs text-left">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
              i < currentStep
                ? "border-accent/30 bg-accent/5 text-accent"
                : i === currentStep
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-[var(--color-border)] bg-surface text-text-secondary"
            }`}
          >
            <span
              className={i === currentStep ? "animate-pulse" : ""}
            >
              {step.icon}
            </span>
            <div>
              <p className="text-xs font-medium">{step.label}</p>
              <p className="text-xs opacity-70">{step.description}</p>
            </div>
            {i < currentStep && (
              <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-accent shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
