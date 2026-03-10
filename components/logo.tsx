import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}

export function Logo({
  href = "/",
  className,
  showWordmark = true,
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4.5L9 2L15 4.5V9C15 12.5 12 15.5 9 16.5C6 15.5 3 12.5 3 9V4.5Z"
            fill="#0A0A0A"
            fillOpacity="0.9"
          />
          <path
            d="M6.5 9L8.5 11L11.5 7.5"
            stroke="#00D4AA"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <span className="text-base font-bold text-text-primary tracking-tight">
          TrainDrop
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
