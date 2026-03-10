import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <Logo />
      </div>
      <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Page not found
      </h2>
      <p className="text-text-secondary max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="primary">Go Home</Button>
      </Link>
    </div>
  );
}
