import Link from "next/link";
import { Logo } from "@/components/logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Logo />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Acceptance
            </h2>
            <p>
              By using TrainDrop, you agree to these terms. If you do not agree,
              do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Your Content
            </h2>
            <p>
              You retain ownership of all content you upload. By uploading, you
              grant TrainDrop a license to process and store it for the purpose
              of providing the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Acceptable Use
            </h2>
            <p>
              You may not use TrainDrop to create content that is illegal,
              harmful, or violates others&apos; rights. We reserve the right to
              suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Limitation of Liability
            </h2>
            <p>
              TrainDrop is provided &quot;as is.&quot; We are not liable for any
              damages arising from the use of the service, including loss of
              data or business interruption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Changes
            </h2>
            <p>
              We may update these terms at any time. Continued use of the
              service constitutes acceptance of the updated terms.
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
