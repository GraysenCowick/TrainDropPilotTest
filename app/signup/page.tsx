"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && businessName.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("profiles")
        .update({ business_name: businessName.trim() })
        .eq("id", data.user.id);
    }

    // If session is already set, email confirmation is disabled — go straight to dashboard.
    // If session is null, confirmation is required — show the check-inbox screen.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setCheckEmail(true);
      setLoading(false);
    }
  }

  // ── Check-your-inbox screen ───────────────────────────────────────────────
  if (checkEmail) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          <div className="bg-surface border border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Mail className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">
                Check your inbox
              </h1>
              <p className="text-sm text-text-secondary mt-2">
                We sent a confirmation link to{" "}
                <span className="text-accent font-medium">{email}</span>.
                Click it to activate your account.
              </p>
            </div>
            <p className="text-xs text-text-secondary">
              Already confirmed?{" "}
              <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-surface border border-[var(--color-border)] rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text-primary">
              Create your account
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Start building training modules in minutes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Business Name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Cleaning Co."
              autoComplete="organization"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              hint="At least 8 characters"
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-1"
            >
              Create Account — Free
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary mt-6">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-text-primary">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
