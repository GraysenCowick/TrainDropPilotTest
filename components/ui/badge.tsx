import { cn } from "@/lib/utils";
import type { ModuleStatus } from "@/lib/supabase/types";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-text-secondary border-white/10",
  success: "bg-accent/10 text-accent border-accent/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function Badge({
  variant = "default",
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              variant === "warning" ? "bg-amber-400" : "bg-accent"
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5",
              variant === "warning" ? "bg-amber-400" : "bg-accent"
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ModuleStatus }) {
  const config: Record<
    ModuleStatus,
    { label: string; variant: BadgeVariant; pulse: boolean }
  > = {
    processing: { label: "Processing", variant: "warning", pulse: true },
    ready: { label: "Ready", variant: "info", pulse: false },
    published: { label: "Published", variant: "success", pulse: false },
    error: { label: "Error", variant: "error", pulse: false },
  };

  const { label, variant, pulse } = config[status];

  return (
    <Badge variant={variant} pulse={pulse}>
      {label}
    </Badge>
  );
}
