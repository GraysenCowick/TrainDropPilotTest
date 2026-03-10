"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <Logo />
      </div>
      <h1 className="text-xl font-semibold text-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-text-secondary max-w-sm mb-8">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={reset}>
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
