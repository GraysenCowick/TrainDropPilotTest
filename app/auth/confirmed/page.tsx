import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-surface border border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-accent" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Email verified!
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              Your account is confirmed and ready to go. Head to your dashboard to start building training modules.
            </p>
          </div>

          <Link href="/dashboard" className="w-full">
            <Button variant="primary" size="lg" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
