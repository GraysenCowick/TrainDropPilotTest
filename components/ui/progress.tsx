import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function Progress({
  value,
  className,
  showLabel = false,
  size = "md",
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 bg-white/10 rounded-full overflow-hidden",
          size === "sm" ? "h-1" : "h-2"
        )}
      >
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-secondary tabular-nums w-8 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
