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
        <p className="text-sm text-text-secondary mb-2">
          Effective Date: March 19, 2026
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          TrainDrop (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the
          privacy of our users and their employees. This Privacy Policy
          explains what information we collect, how we use it, who we share
          it with, and the choices you have.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          This policy applies to two types of users:{" "}
          <span className="font-medium text-text-primary">
            Account Users
          </span>{" "}
          (business owners or managers who create a TrainDrop account) and{" "}
          <span className="font-medium text-text-primary">
            Team Members
          </span>{" "}
          (employees who access training content through links shared by an
          Account User). Both types are covered by this policy.
        </p>

        {/* Table of Contents */}
        <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 mb-10">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Contents
          </p>
          <ol className="text-sm space-y-1.5 text-text-secondary">
            {[
              ["#p1", "1. Information We Collect"],
              ["#p2", "2. How We Collect Information"],
              ["#p3", "3. How We Use Your Information"],
              ["#p4", "4. AI Processing of Your Content"],
              ["#p5", "5. Employee and Team Member Data"],
              ["#p6", "6. Third-Party Services and Data Sharing"],
              ["#p7", "7. Data Storage and Security"],
              ["#p8", "8. Data Retention and Deletion"],
              ["#p9", "9. Your Rights and Choices"],
              ["#p10", "10. Cookies and Tracking Technologies"],
              ["#p11", "11. Children's Privacy"],
              ["#p12", "12. California Residents (CCPA)"],
              ["#p13", "13. International Users and GDPR"],
              ["#p14", "14. Changes to This Policy"],
              ["#p15", "15. Contact Us"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-10 text-sm text-text-secondary leading-relaxed">

          <section id="p1">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              1. Information We Collect
            </h2>

            <h3 className="font-medium text-text-primary mb-2">
              A. Account Users (Business Owners and Managers)
            </h3>
            <p className="mb-2">
              When you create and use a TrainDrop account, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-4">
              <li>
                <span className="font-medium text-text-primary">
                  Account information:
                </span>{" "}
                email address, business name, and password (stored as a
                secure hash — we never store your plain-text password)
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Payment information:
                </span>{" "}
                billing details are collected and stored by Stripe, our
                payment processor. We store only a Stripe customer ID — we
                never see or store your full credit card number
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Subscription data:
                </span>{" "}
                your plan tier, billing history, and trial status
              </li>
            </ul>

            <h3 className="font-medium text-text-primary mb-2">
              B. Team Members (Employees)
            </h3>
            <p className="mb-2">
              When an Account User adds employees to TrainDrop, we collect
              and store the following on their behalf:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-4">
              <li>
                Name and email address (provided by the Account User, not
                the employee directly)
              </li>
              <li>
                Training activity: whether they viewed and completed each
                module, timestamps of completion, and time spent on each
                module
              </li>
              <li>
                Link access data: when they clicked training links and basic
                device/browser metadata at the time of access
              </li>
            </ul>
            <p className="mb-4">
              Team Members do not create TrainDrop accounts. Their data is
              entered by the Account User (their employer) and associated
              with that Account User&apos;s account.
            </p>

            <h3 className="font-medium text-text-primary mb-2">
              C. Content You Upload
            </h3>
            <p className="mb-2">
              We collect and process content you upload, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-4">
              <li>
                Video files uploaded via your browser (stored in Supabase
                Storage)
              </li>
              <li>
                Audio files extracted from video in your browser before
                upload (used for transcription, then retained as part of
                the module)
              </li>
              <li>PDF and DOCX files you import for SOP generation</li>
              <li>
                Typed text — notes or process descriptions you enter
                directly
              </li>
            </ul>

            <h3 className="font-medium text-text-primary mb-2">
              D. Automatically Collected Information
            </h3>
            <p className="mb-2">
              When you use the Service, we automatically collect:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Log data: IP address, browser type, operating system, pages
                visited, and time and date of access
              </li>
              <li>
                Device information: browser version, screen size, and device
                type
              </li>
              <li>
                Cookies and similar tracking technologies (see Section 10)
              </li>
            </ul>
          </section>

          <section id="p2">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              2. How We Collect Information
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Directly from you when you create an account, add team
                members, or upload content
              </li>
              <li>
                Automatically when you interact with the Service (via
                cookies and server logs)
              </li>
              <li>
                From your employees when they click training links (limited
                to access timestamps and completion events)
              </li>
              <li>
                From Stripe when you complete a payment transaction (Stripe
                confirms payment status; we do not receive raw card data)
              </li>
            </ul>
          </section>

          <section id="p3">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              3. How We Use Your Information
            </h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Create and manage your account and subscription</li>
              <li>
                Process your uploaded content using AI to generate training
                modules
              </li>
              <li>
                Send training links to your team members and record their
                completion
              </li>
              <li>
                Send transactional emails (account confirmation, password
                reset, and team member training invitations)
              </li>
              <li>Process payments and manage billing</li>
              <li>Provide customer support</li>
              <li>
                Monitor for abuse, fraud, and security threats
              </li>
              <li>Comply with legal obligations</li>
              <li>
                Improve the Service using aggregated, anonymized usage data
              </li>
            </ul>
            <p className="mt-3">
              <span className="font-medium text-text-primary">
                We do not sell your personal information to third parties.
              </span>{" "}
              We do not use your content or your employees&apos; data to train
              AI models.
            </p>
          </section>

          <section id="p4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              4. AI Processing of Your Content
            </h2>
            <p className="mb-3">
              When you upload a video or document to TrainDrop, portions of
              that content are sent to third-party AI services for
              processing. Here is exactly what each service receives:
            </p>
            <div className="space-y-4">
              <div className="bg-surface border border-[var(--color-border)] rounded-xl p-4">
                <p className="font-medium text-text-primary mb-1">
                  OpenAI Whisper — Transcription
                </p>
                <p>
                  Audio extracted from your video is sent to OpenAI&apos;s
                  Whisper API for speech-to-text transcription. OpenAI
                  receives the audio file and returns a text transcript.
                  OpenAI does not receive the original video file.
                </p>
              </div>
              <div className="bg-surface border border-[var(--color-border)] rounded-xl p-4">
                <p className="font-medium text-text-primary mb-1">
                  Anthropic Claude — SOP Generation
                </p>
                <p>
                  The transcript text (or your typed notes) is sent to
                  Anthropic&apos;s Claude API to generate a structured SOP.
                  Anthropic receives text only — not the original video or
                  audio file.
                </p>
              </div>
              <div className="bg-surface border border-[var(--color-border)] rounded-xl p-4">
                <p className="font-medium text-text-primary mb-1">
                  Video Processing — Encoding and Captions
                </p>
                <p>
                  Your video file is processed using FFmpeg for encoding
                  and caption-burning. This processing occurs on server
                  infrastructure and does not involve sharing your video
                  with an AI language model.
                </p>
              </div>
            </div>
            <p className="mt-3">
              As of the effective date of this policy, neither OpenAI nor
              Anthropic uses data submitted via their APIs to train their
              models by default. However, you should review their respective
              privacy policies for the most current information.
            </p>
          </section>

          <section id="p5">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              5. Employee and Team Member Data
            </h2>
            <p className="mb-3">
              This section specifically addresses how we handle data about
              the employees you add to TrainDrop.
            </p>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                You control your employees&apos; data.
              </span>{" "}
              As an Account User, you are the data controller for your
              employees&apos; personal information stored in TrainDrop. TrainDrop
              acts as a data processor, handling that data on your behalf
              and according to your instructions.
            </p>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                Your responsibilities.
              </span>{" "}
              By adding employee data to TrainDrop, you represent that you
              have the appropriate authority — and, where required by law,
              consent — from your employees to collect and process their
              names, email addresses, and training activity data.
            </p>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                What we collect about employees.
              </span>{" "}
              Name (provided by you), email address (provided by you),
              training link access timestamps, module completion status,
              and time spent on each module.
            </p>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                How employees access training.
              </span>{" "}
              Employees receive email links containing unique access tokens.
              They access training content through these links without
              creating a TrainDrop account. The token is tied to their
              email address so completion can be recorded.
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Employee data deletion.
              </span>{" "}
              An employee who wants their data removed should contact you
              (their employer). You can delete individual employee records
              from the team management section of your dashboard, or you
              can delete your entire account to remove all associated
              employee data.
            </p>
          </section>

          <section id="p6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              6. Third-Party Services and Data Sharing
            </h2>
            <p className="mb-4">
              We share your information with the following third-party
              services as necessary to provide the Service. Each service
              operates under its own privacy policy.
            </p>
            <div className="space-y-3">
              {[
                {
                  name: "Supabase",
                  purpose: "Database, authentication, and file storage",
                  data: "All account data, uploaded files, team member records, and completion data",
                },
                {
                  name: "Vercel",
                  purpose: "Application hosting and serverless functions",
                  data: "Request metadata and server logs",
                },
                {
                  name: "Anthropic (Claude API)",
                  purpose: "AI-powered SOP generation and text refinement",
                  data: "Transcription text and typed notes — no video or audio",
                },
                {
                  name: "OpenAI (Whisper API)",
                  purpose: "Audio transcription",
                  data: "Audio files extracted from uploaded videos",
                },
                {
                  name: "Replicate",
                  purpose: "Video processing and encoding",
                  data: "Video files",
                },
                {
                  name: "Stripe",
                  purpose: "Payment processing",
                  data: "Billing details and payment transaction data",
                },
                {
                  name: "Resend",
                  purpose: "Transactional email delivery",
                  data: "Team member names, email addresses, and email content",
                },
              ].map(({ name, purpose, data }) => (
                <div
                  key={name}
                  className="bg-surface border border-[var(--color-border)] rounded-xl p-4"
                >
                  <p className="font-medium text-text-primary mb-1">{name}</p>
                  <p>
                    <span className="text-text-primary">Purpose:</span>{" "}
                    {purpose}
                  </p>
                  <p>
                    <span className="text-text-primary">Data shared:</span>{" "}
                    {data}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              We do not share your personal information with any other
              third parties except:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                When required by law, court order, or governmental authority
              </li>
              <li>
                To protect the rights, safety, or property of TrainDrop,
                its users, or the public
              </li>
              <li>
                In connection with a merger, acquisition, or sale of assets,
                with prior notice to you
              </li>
            </ul>
          </section>

          <section id="p7">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              7. Data Storage and Security
            </h2>
            <p className="mb-2">
              All TrainDrop data is stored in the United States on Supabase
              infrastructure (hosted on AWS). Uploaded files — videos,
              audio, and documents — are stored in Supabase Storage.
            </p>
            <p className="mb-2">Security measures we use:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                All data in transit is encrypted via HTTPS/TLS
              </li>
              <li>
                Passwords are hashed using industry-standard bcrypt — we
                never store plain-text passwords
              </li>
              <li>
                Database access is restricted and authenticated
              </li>
              <li>
                Supabase Row Level Security (RLS) ensures each account can
                only access its own data
              </li>
              <li>
                Employee training links use unique, cryptographically
                generated tokens
              </li>
            </ul>
            <p className="mt-3">
              While we take security seriously and follow industry best
              practices, no system is perfectly secure. We cannot guarantee
              the absolute security of your data. In the event of a security
              breach that affects your personal data, we will notify you as
              required by applicable law.
            </p>
          </section>

          <section id="p8">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              8. Data Retention and Deletion
            </h2>
            <ul className="space-y-2.5">
              <li>
                <span className="font-medium text-text-primary">
                  Active accounts:
                </span>{" "}
                Your data is retained as long as your account is active.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  After cancellation:
                </span>{" "}
                If you cancel your subscription, your account enters a
                paused state and your data is retained for 90 days, after
                which it is permanently deleted.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Account deletion:
                </span>{" "}
                If you delete your account from your settings, all data —
                including modules, videos, employee records, and completion
                data — is permanently deleted within 30 days.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Uploaded files:
                </span>{" "}
                Video and audio files are deleted when you delete the
                associated module or close your account.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Billing records:
                </span>{" "}
                We may retain certain billing and transaction records longer
                than 90 days as required by tax and accounting laws.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Anonymized data:
                </span>{" "}
                We may retain aggregated, anonymized usage statistics
                indefinitely for business analytics. This data cannot be
                linked back to you.
              </li>
            </ul>
          </section>

          <section id="p9">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              9. Your Rights and Choices
            </h2>
            <p className="mb-3">
              Depending on where you live, you may have the following rights
              regarding your personal information:
            </p>
            <ul className="space-y-2.5">
              <li>
                <span className="font-medium text-text-primary">
                  Access:
                </span>{" "}
                Request a copy of the personal information we hold about you.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Correction:
                </span>{" "}
                Request that we correct inaccurate or incomplete information.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Deletion:
                </span>{" "}
                Request deletion of your personal information (&quot;right to
                be forgotten&quot;).
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Portability:
                </span>{" "}
                Request a copy of your data in a portable, machine-readable
                format.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Objection:
                </span>{" "}
                Object to certain processing of your data in circumstances
                where we rely on legitimate interests as our legal basis.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at
              privacy@traindrop.app. We will respond within 30 days. For
              many account-level actions, you can also manage your data
              directly in your account settings.
            </p>
            <p className="mt-2">
              Team Members (employees) who want to access, correct, or
              delete their data should contact their employer (the Account
              User who added them to TrainDrop), as the employer controls
              that data.
            </p>
          </section>

          <section id="p10">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              10. Cookies and Tracking Technologies
            </h2>
            <p className="mb-3">
              TrainDrop uses cookies and similar technologies as follows:
            </p>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-text-primary mb-1">
                  Essential cookies
                </p>
                <p>
                  Required for the Service to function. These include
                  authentication tokens (session cookies) that keep you
                  logged in. You cannot disable essential cookies without
                  preventing login.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">
                  Analytics
                </p>
                <p>
                  We may use privacy-respecting analytics tools to
                  understand aggregate usage patterns (for example, which
                  features are most used). These do not track you across
                  other websites.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">
                  Third-party cookies
                </p>
                <p>
                  Stripe and other third-party services may set their own
                  cookies when you interact with payment or other embedded
                  features. These are governed by their respective privacy
                  policies.
                </p>
              </div>
            </div>
            <p className="mt-3">
              You can manage cookie preferences through your browser
              settings. Note that disabling essential cookies will prevent
              you from logging in to the Service.
            </p>
          </section>

          <section id="p11">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              11. Children&apos;s Privacy
            </h2>
            <p className="mb-2">
              TrainDrop is not directed at children under the age of 13 and
              we do not knowingly collect personal information from children
              under 13. If you believe we have inadvertently collected
              personal information from a child under 13, please contact us
              at privacy@traindrop.app and we will delete it promptly.
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Employees under 18:
              </span>{" "}
              Some businesses that use TrainDrop — such as restaurants,
              retail stores, or family-owned businesses — may employ workers
              under the age of 18. If your team members include minors, you
              are responsible for: (a) ensuring appropriate parental or
              guardian consent has been obtained where required by applicable
              law, and (b) complying with all laws in your jurisdiction
              governing the collection of personal information from minors.
              TrainDrop does not independently verify the ages of Team
              Members.
            </p>
          </section>

          <section id="p12">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              12. California Residents (CCPA)
            </h2>
            <p className="mb-2">
              If you are a California resident, the California Consumer
              Privacy Act (CCPA) grants you the following rights.
            </p>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                Categories of personal information we collect
              </span>{" "}
              (from Account Users): identifiers (name, email address, IP
              address); commercial information (subscription and billing
              data); internet or other electronic network activity
              (usage logs, pages visited); and inferences drawn from
              the above.
            </p>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                Your CCPA rights:
              </span>
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-3">
              <li>
                <span className="font-medium text-text-primary">
                  Right to know:
                </span>{" "}
                request disclosure of the personal data we have collected
                about you and how we use and share it
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Right to delete:
                </span>{" "}
                request deletion of your personal data, subject to certain
                legal exceptions
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Right to opt out of sale:
                </span>{" "}
                TrainDrop does not sell your personal information
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Right to non-discrimination:
                </span>{" "}
                we will not discriminate against you for exercising your
                CCPA rights
              </li>
            </ul>
            <p className="mb-2">
              To exercise your rights, email privacy@traindrop.app. We will
              verify your identity before responding.
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Shine the Light:
              </span>{" "}
              California residents may request information about any sharing
              of personal information with third parties for their direct
              marketing purposes under California Civil Code Section 1798.83.
              TrainDrop does not share personal information with third
              parties for direct marketing purposes.
            </p>
          </section>

          <section id="p13">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              13. International Users and GDPR
            </h2>
            <p className="mb-2">
              TrainDrop is operated from the United States. If you are
              accessing the Service from the European Union, European
              Economic Area, or United Kingdom, please be aware that your
              data will be transferred to and processed in the United States,
              which may not have the same data protection laws as your
              country.
            </p>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                Legal basis for processing (GDPR):
              </span>
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-3">
              <li>
                <span className="font-medium text-text-primary">
                  Contract performance:
                </span>{" "}
                processing necessary to provide the Service you requested
                (account management, training module generation)
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Legitimate interests:
                </span>{" "}
                service improvement, security monitoring, and fraud
                prevention
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Legal obligation:
                </span>{" "}
                compliance with applicable law
              </li>
            </ul>
            <p className="mb-2">
              <span className="font-medium text-text-primary">
                Your GDPR rights
              </span>{" "}
              include the right to access, rectification, erasure,
              restriction of processing, data portability, and the right to
              object. To exercise these rights, email privacy@traindrop.app.
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Data Processing Addendum (DPA):
              </span>{" "}
              If you are an EU/EEA business that adds EU-based employees to
              TrainDrop, you may be required under GDPR to have a data
              processing agreement in place with us. Contact
              privacy@traindrop.app to request a DPA.
            </p>
          </section>

          <section id="p14">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              14. Changes to This Policy
            </h2>
            <p className="mb-2">
              We may update this Privacy Policy from time to time. When we
              make material changes, we will:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Post the updated policy on this page with a new effective
                date
              </li>
              <li>
                Send an email notification to your account email address
              </li>
            </ul>
            <p className="mt-2">
              Your continued use of the Service after changes take effect
              constitutes your acceptance of the updated policy. If you do
              not agree to the changes, you must stop using the Service.
            </p>
          </section>

          <section id="p15">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              15. Contact Us
            </h2>
            <p className="mb-3">
              If you have questions, concerns, or requests related to this
              Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 space-y-1">
              <p>
                <span className="font-medium text-text-primary">
                  Privacy inquiries:
                </span>{" "}
                privacy@traindrop.app
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  General support:
                </span>{" "}
                support@traindrop.app
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  Location:
                </span>{" "}
                Lincoln, Nebraska, United States
              </p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
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
