"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="bg-surface border border-[var(--color-border)] rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text-primary">
              Welcome back
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Sign in to your TrainDrop account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              autoComplete="current-password"
            />

            {error && (
              error.toLowerCase().includes("email not confirmed") ? (
                <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 flex flex-col gap-1">
                  <p className="text-sm font-medium text-text-primary">Check your inbox</p>
                  <p className="text-sm text-text-secondary">
                    We sent a confirmation link to <span className="text-accent">{email}</span>. Click it to activate your account, then sign in.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-1"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary mt-6">
          By signing in, you agree to our{" "}
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
