import Link from "next/link";
import { Logo } from "@/components/logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Logo />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              What We Collect
            </h2>
            <p>
              We collect the information you provide when creating an account
              (email, business name), the content you upload (videos, notes),
              and usage data to improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              How We Use It
            </h2>
            <p>
              Your content is used solely to generate training modules as
              requested. We do not sell your data or use it to train AI models
              without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Third-Party Services
            </h2>
            <p>
              We use Supabase (database/auth), Anthropic Claude (AI generation),
              OpenAI Whisper (transcription), OpenAI TTS (voiceover), and
              Replicate (video processing). Each service has its own privacy
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Data Retention
            </h2>
            <p>
              Your data is retained as long as your account is active. You may
              delete your account at any time from the settings page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Contact
            </h2>
            <p>
              Questions? Email us at privacy@traindrop.app (placeholder — update
              before launch).
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            ← Back to TrainDrop
          </Link>
        </div>
      </div>
    </div>
  );
}
