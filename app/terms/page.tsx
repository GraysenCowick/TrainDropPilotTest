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
        <p className="text-sm text-text-secondary mb-2">
          Effective Date: March 19, 2026
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          These Terms of Service (&quot;Terms&quot;) are a legal agreement between you
          and TrainDrop (&quot;TrainDrop,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your
          access to and use of the TrainDrop website and service (collectively,
          the &quot;Service&quot;). By creating an account or using the Service, you
          agree to be bound by these Terms. If you are using TrainDrop on
          behalf of a business, you represent that you have authority to bind
          that business to these Terms.
        </p>

        {/* Table of Contents */}
        <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 mb-10">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Contents
          </p>
          <ol className="text-sm space-y-1.5 text-text-secondary">
            {[
              ["#s1", "1. Acceptance of Terms"],
              ["#s2", "2. Description of Service"],
              ["#s3", "3. Account Registration and Security"],
              ["#s4", "4. Free Trial"],
              ["#s5", "5. Paid Plans, Billing, and Payment"],
              ["#s6", "6. Cancellation and Refund Policy"],
              ["#s7", "7. Your Content: Ownership and License"],
              ["#s8", "8. AI-Generated Content"],
              ["#s9", "9. Employee and Team Member Data"],
              ["#s10", "10. Acceptable Use Policy"],
              ["#s11", "11. Intellectual Property"],
              ["#s12", "12. Third-Party Services"],
              ["#s13", "13. Termination and Suspension"],
              ["#s14", "14. Disclaimer of Warranties"],
              ["#s15", "15. Limitation of Liability"],
              ["#s16", "16. Indemnification"],
              ["#s17", "17. Governing Law"],
              ["#s18", "18. Dispute Resolution"],
              ["#s19", "19. Changes to These Terms"],
              ["#s20", "20. General Provisions"],
              ["#s21", "21. Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-accent hover:text-accent-hover transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-10 text-sm text-text-secondary leading-relaxed">

          <section id="s1">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using TrainDrop, you confirm that you are at least
              18 years old, have the legal capacity to enter into a binding
              agreement, and agree to comply with these Terms. If you do not
              agree to these Terms, do not use the Service.
            </p>
          </section>

          <section id="s2">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              2. Description of Service
            </h2>
            <p>
              TrainDrop is a software-as-a-service (SaaS) platform that helps
              small businesses create employee training materials. You can upload
              a phone-recorded video or typed notes, and TrainDrop uses
              artificial intelligence — including speech-to-text transcription,
              natural language generation, and video encoding — to produce
              structured training modules that include written Standard Operating
              Procedures (SOPs), captioned videos, and shareable training tracks.
            </p>
            <p className="mt-2">
              The Service allows you to add team members (your employees), send
              them unique training links, and track their completion status.
              Employees access training content via links sent by email and do
              not need to create a TrainDrop account.
            </p>
          </section>

          <section id="s3">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              3. Account Registration and Security
            </h2>
            <p className="mb-2">When you create an account, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide accurate, current, and complete registration information</li>
              <li>Keep your account credentials confidential and not share them with others</li>
              <li>Promptly notify us if you suspect unauthorized access to your account</li>
              <li>
                Be solely responsible for all activity that occurs under your
                account, including actions taken by anyone you allow to use it
              </li>
            </ul>
            <p className="mt-2">
              You must be at least 18 years old to create an account. By
              creating an account on behalf of a company or other entity, you
              represent that you are authorized to bind that entity to these Terms.
            </p>
          </section>

          <section id="s4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              4. Free Trial
            </h2>
            <p className="mb-2">
              TrainDrop offers a 30-day free trial to new accounts. Here is what
              you need to know:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>No credit card is required to start your free trial</li>
              <li>
                You have full access to all features of the Service during the
                trial period
              </li>
              <li>Your trial begins on the date you create your account</li>
              <li>
                At the end of the 30-day trial, your account will be{" "}
                <span className="font-medium text-text-primary">paused</span> —
                meaning you can still log in and view existing content, but you
                cannot create new modules, invite new team members, or process
                new videos until you subscribe to a paid plan
              </li>
              <li>
                Your content and data are preserved during the paused state for
                up to 90 days, after which they may be permanently deleted
              </li>
              <li>
                TrainDrop reserves the right to modify, shorten, or discontinue
                the free trial offering at any time
              </li>
            </ul>
          </section>

          <section id="s5">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              5. Paid Plans, Billing, and Payment
            </h2>
            <p className="mb-2">
              Paid subscription plans are available at prices listed on our
              pricing page. Key billing terms:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Subscriptions are billed on a monthly or annual basis depending
                on your selection at signup
              </li>
              <li>Annual subscriptions are billed upfront for the full year</li>
              <li>
                Payments are processed by Stripe, our third-party payment
                processor. By providing payment information, you authorize us to
                charge you on a recurring basis
              </li>
              <li>
                Subscriptions automatically renew at the end of each billing
                period unless you cancel before the renewal date
              </li>
              <li>
                We may change subscription prices with at least 30 days&apos;
                advance notice sent to your account email. Your continued use
                of the Service after a price change takes effect constitutes
                your acceptance of the new price
              </li>
              <li>All prices are listed and charged in U.S. dollars</li>
              <li>
                If a payment fails, we will notify you and may suspend your
                account until payment is successfully collected
              </li>
            </ul>
          </section>

          <section id="s6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              6. Cancellation and Refund Policy
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You may cancel your subscription at any time from your account
                settings or by emailing support@traindrop.app
              </li>
              <li>
                Cancellation takes effect at the end of your current billing
                period; you retain full access to the Service until then
              </li>
              <li>
                We do not offer refunds for partial billing periods on monthly
                subscriptions
              </li>
              <li>
                Annual subscriptions are non-refundable, except as required by
                applicable law or in cases where TrainDrop terminates your
                account without cause — in which case you will receive a
                pro-rated refund for the unused portion of your subscription
              </li>
              <li>
                If you cancel during your free trial, no charge will be made
              </li>
            </ul>
          </section>

          <section id="s7">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              7. Your Content: Ownership and License
            </h2>
            <p>
              You retain full ownership of all content you upload to TrainDrop
              (&quot;Your Content&quot;), including videos, audio files, documents, and
              written notes.
            </p>
            <p className="mt-2">
              By uploading Your Content, you grant TrainDrop a non-exclusive,
              worldwide, royalty-free license to store, process, transmit, and
              display Your Content solely for the purpose of providing the
              Service to you. This license terminates when you delete Your
              Content or close your account.
            </p>
            <p className="mt-2">
              AI-generated outputs produced by TrainDrop from Your Content —
              including SOPs, captions, and training modules — are delivered to
              you as part of the Service. You own those outputs and may use
              them however you choose.
            </p>
            <p className="mt-2 mb-2">
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You have all necessary rights, permissions, and authorizations
                to upload Your Content
              </li>
              <li>
                Your Content does not infringe any third-party intellectual
                property rights, including copyright or trademark
              </li>
              <li>
                You have appropriate authority or consent to upload any personal
                information about individuals — including your employees — that
                appears in Your Content
              </li>
              <li>Your Content complies with all applicable laws</li>
            </ul>
            <p className="mt-2">
              TrainDrop may use aggregated, anonymized usage data (not including
              Your Content or any identifying information) to improve the Service.
            </p>
          </section>

          <section id="s8">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              8. AI-Generated Content
            </h2>
            <p className="mb-3">
              TrainDrop uses artificial intelligence to generate training
              materials from your uploaded content. Please understand the
              following before distributing AI-generated content to your team:
            </p>
            <div className="space-y-3">
              <p>
                <span className="font-medium text-text-primary">
                  The AI may make mistakes.
                </span>{" "}
                SOPs, transcriptions, summaries, and other AI-generated content
                may contain errors, omissions, or inaccuracies. You are
                responsible for reviewing all AI-generated content before
                distributing it to your employees.
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  Not professional advice.
                </span>{" "}
                Nothing generated by TrainDrop constitutes legal, HR,
                occupational safety, compliance, or other professional advice.
                For safety-critical or legally sensitive training materials,
                consult qualified professionals before use.
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  No accuracy guarantees.
                </span>{" "}
                TrainDrop makes no warranties about the accuracy, completeness,
                fitness for purpose, or reliability of any AI-generated content.
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  Third-party AI processing.
                </span>{" "}
                Your content is processed by third-party AI services including
                Anthropic (Claude API) and OpenAI (Whisper). By using TrainDrop,
                you consent to this processing. See our Privacy Policy for
                details on what each service receives.
              </p>
            </div>
          </section>

          <section id="s9">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              9. Employee and Team Member Data
            </h2>
            <p className="mb-2">
              TrainDrop allows you to add your employees as team members and
              track their training completion. By using this feature:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You represent that you have the legal authority — and, where
                required by applicable law, appropriate consent — of your
                employees to collect and share their names, email addresses,
                and training activity data with TrainDrop
              </li>
              <li>
                You are responsible for complying with all applicable
                employment, privacy, and data protection laws in your
                jurisdiction regarding tracking of employee training activities
              </li>
              <li>
                You agree to inform your employees that their training
                completion status and time spent on modules are tracked
              </li>
            </ul>
            <p className="mt-2">
              You are the data controller for your employees&apos; personal
              information that you input into TrainDrop. TrainDrop processes
              this data on your behalf as a data processor.
            </p>
          </section>

          <section id="s10">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              10. Acceptable Use Policy
            </h2>
            <p className="mb-2">You agree not to use TrainDrop to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Upload content that is illegal, defamatory, harassing,
                threatening, obscene, or fraudulent
              </li>
              <li>
                Upload content that infringes any third-party intellectual
                property rights, including copyright or trademark
              </li>
              <li>Upload content containing malware, viruses, or harmful code</li>
              <li>
                Violate the privacy rights of others or collect personal
                information without appropriate authorization
              </li>
              <li>
                Impersonate any person or entity, or misrepresent your
                affiliation with any person or organization
              </li>
              <li>
                Attempt to reverse engineer, decompile, or extract source
                code from TrainDrop
              </li>
              <li>
                Circumvent, disable, or interfere with any security or access
                control features of the Service
              </li>
              <li>
                Use automated scripts, bots, or scrapers to access the Service
                beyond normal usage patterns
              </li>
              <li>
                Resell, sublicense, or commercially exploit access to the
                Service without our written permission
              </li>
              <li>
                Use the Service in any way that violates applicable local,
                state, national, or international law
              </li>
            </ul>
            <p className="mt-2">
              We reserve the right to investigate suspected violations and take
              appropriate action, including suspending or permanently terminating
              your account.
            </p>
          </section>

          <section id="s11">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              11. Intellectual Property
            </h2>
            <p>
              TrainDrop — including its software, user interface, design, brand,
              documentation, and all underlying technology — is owned by
              TrainDrop and protected by U.S. and international copyright,
              trademark, and other intellectual property laws. These Terms do
              not grant you any ownership rights in TrainDrop or its technology.
            </p>
            <p className="mt-2">
              The &quot;TrainDrop&quot; name and logo are trademarks of TrainDrop. You
              may not use our trademarks without prior written permission.
            </p>
            <p className="mt-2">
              If you provide feedback, suggestions, or ideas about the Service
              (&quot;Feedback&quot;), you grant TrainDrop an unrestricted, perpetual,
              irrevocable, royalty-free license to use that Feedback for any
              purpose — including incorporating it into the Service — without
              compensation or attribution to you.
            </p>
          </section>

          <section id="s12">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              12. Third-Party Services
            </h2>
            <p className="mb-3">
              TrainDrop relies on the following third-party services to operate.
              Your use of TrainDrop involves these services processing your data
              subject to their own terms and privacy policies:
            </p>
            <ul className="space-y-2">
              {[
                ["Supabase", "database, authentication, and file storage"],
                ["Vercel", "application hosting and serverless computing"],
                ["Anthropic (Claude API)", "AI-powered SOP generation and text refinement"],
                ["OpenAI (Whisper API)", "audio transcription"],
                ["Replicate", "video processing and encoding"],
                ["Stripe", "payment processing"],
                ["Resend", "transactional email delivery"],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-2">
                  <span className="text-accent shrink-0">—</span>
                  <span>
                    <span className="font-medium text-text-primary">{name}</span>
                    {": "}
                    {desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              TrainDrop is not responsible for the acts, omissions, or privacy
              practices of any third-party service.
            </p>
          </section>

          <section id="s13">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              13. Termination and Suspension
            </h2>
            <p>
              <span className="font-medium text-text-primary">By you:</span>{" "}
              You may close your account at any time from your account settings.
              Upon account deletion, your data will be permanently deleted
              within 30 days, subject to any legal retention obligations.
            </p>
            <p className="mt-2">
              <span className="font-medium text-text-primary">
                By TrainDrop:
              </span>{" "}
              We may suspend or terminate your access to the Service, with or
              without notice, if we determine that you have:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Violated these Terms or our Acceptable Use Policy</li>
              <li>Failed to pay subscription fees when due</li>
              <li>
                Engaged in conduct that is harmful to other users, the
                Service, or third parties
              </li>
              <li>
                Provided false or materially misleading information in your
                account registration
              </li>
            </ul>
            <p className="mt-2">
              We will make reasonable efforts to provide advance notice before
              termination where practicable, except in cases of material
              violations, illegal activity, fraud, or legal requirements that
              demand immediate action.
            </p>
            <p className="mt-2">
              <span className="font-medium text-text-primary">
                Effect of termination:
              </span>{" "}
              Upon termination, your right to use the Service immediately
              ceases. Sections 7, 8, 11, 14, 15, 16, 17, and 18 of these
              Terms will survive termination.
            </p>
          </section>

          <section id="s14">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              14. Disclaimer of Warranties
            </h2>
            <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 space-y-3 text-xs leading-relaxed">
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE
                FULLEST EXTENT PERMITTED BY APPLICABLE LAW, TRAINDROP EXPRESSLY
                DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                  PARTICULAR PURPOSE, AND NON-INFRINGEMENT
                </li>
                <li>
                  ANY WARRANTY THAT THE SERVICE WILL BE UNINTERRUPTED,
                  ERROR-FREE, SECURE, OR FREE FROM HARMFUL COMPONENTS
                </li>
                <li>
                  ANY WARRANTY REGARDING THE ACCURACY, COMPLETENESS, OR
                  RELIABILITY OF AI-GENERATED CONTENT
                </li>
              </ul>
              <p>YOUR USE OF THE SERVICE IS ENTIRELY AT YOUR OWN RISK.</p>
            </div>
          </section>

          <section id="s15">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              15. Limitation of Liability
            </h2>
            <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 space-y-3 text-xs leading-relaxed">
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, TRAINDROP
                AND ITS OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, AND AGENTS
                SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES — INCLUDING BUT
                NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, LOSS OF GOODWILL,
                BUSINESS INTERRUPTION, OR COST OF SUBSTITUTE SERVICES — ARISING
                OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE
                SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                TRAINDROP&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY AND ALL
                CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE
                SHALL NOT EXCEED THE GREATER OF (A) ONE HUNDRED U.S. DOLLARS
                ($100) OR (B) THE TOTAL AMOUNT YOU PAID TO TRAINDROP IN THE
                TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE
                TO THE CLAIM.
              </p>
              <p>
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF
                CERTAIN WARRANTIES OR DAMAGES, SO SOME OF THE ABOVE MAY NOT
                APPLY TO YOU.
              </p>
            </div>
          </section>

          <section id="s16">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              16. Indemnification
            </h2>
            <p className="mb-2">
              You agree to defend, indemnify, and hold harmless TrainDrop and
              its officers, directors, employees, and agents from and against
              any and all claims, liabilities, damages, losses, and expenses
              (including reasonable attorneys&apos; fees) arising out of or in
              connection with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Your use of or inability to use the Service</li>
              <li>Your Content or anything you share through the Service</li>
              <li>Your violation of these Terms or any applicable law</li>
              <li>
                Your violation of any third-party rights, including
                intellectual property rights or privacy rights
              </li>
              <li>
                Any claims by your employees or team members relating to how
                you used TrainDrop to collect, process, or share their data
              </li>
            </ul>
          </section>

          <section id="s17">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              17. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of the State of Nebraska, United States, without regard to
              its conflict of law provisions. The United Nations Convention on
              Contracts for the International Sale of Goods does not apply.
            </p>
          </section>

          <section id="s18">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              18. Dispute Resolution
            </h2>
            <div className="space-y-3">
              <p>
                <span className="font-medium text-text-primary">
                  Informal resolution first.
                </span>{" "}
                Before filing any formal claim, you agree to contact TrainDrop
                at support@traindrop.app and give us 30 days to attempt to
                resolve the dispute informally.
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  Binding arbitration.
                </span>{" "}
                If informal resolution fails, you and TrainDrop agree to
                resolve disputes through final and binding arbitration
                administered by the American Arbitration Association (AAA)
                under its Commercial Arbitration Rules. Arbitration will take
                place in Lincoln, Nebraska, or via video conference at either
                party&apos;s request. Each party will bear its own attorneys&apos; fees
                unless the arbitrator determines otherwise.
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  Small claims court.
                </span>{" "}
                Either party may bring an eligible individual claim in small
                claims court instead of arbitration.
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  Class action waiver.
                </span>{" "}
                YOU AND TRAINDROP AGREE THAT EACH PARTY MAY ONLY BRING CLAIMS
                AGAINST THE OTHER IN AN INDIVIDUAL CAPACITY AND NOT AS A
                PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE
                ACTION. Class arbitrations are not permitted.
              </p>
              <p>
                <span className="font-medium text-text-primary">
                  Injunctive relief.
                </span>{" "}
                Either party may seek emergency injunctive relief from a court
                of competent jurisdiction to prevent irreparable harm pending
                arbitration.
              </p>
            </div>
          </section>

          <section id="s19">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              19. Changes to These Terms
            </h2>
            <p className="mb-2">
              We may update these Terms from time to time. When we make
              material changes, we will:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Post the updated Terms on this page with a new effective date
              </li>
              <li>
                Send an email notification to the address associated with
                your account
              </li>
            </ul>
            <p className="mt-2">
              Your continued use of the Service after updated Terms take
              effect constitutes your acceptance of the changes. If you do
              not agree to updated Terms, you must stop using the Service.
            </p>
          </section>

          <section id="s20">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              20. General Provisions
            </h2>
            <ul className="space-y-2.5">
              <li>
                <span className="font-medium text-text-primary">
                  Entire agreement.
                </span>{" "}
                These Terms, together with our Privacy Policy, constitute
                the entire agreement between you and TrainDrop regarding the
                Service and supersede any prior agreements.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Severability.
                </span>{" "}
                If any provision of these Terms is found unenforceable, it
                will be modified to the minimum extent necessary to make it
                enforceable, and the remaining provisions will continue in
                full force.
              </li>
              <li>
                <span className="font-medium text-text-primary">Waiver.</span>{" "}
                TrainDrop&apos;s failure to enforce any provision does not waive
                our right to enforce it in the future.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Assignment.
                </span>{" "}
                You may not assign your rights or obligations under these
                Terms without our written consent. TrainDrop may freely
                assign its rights in connection with a merger, acquisition,
                or sale of assets.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  No agency.
                </span>{" "}
                Nothing in these Terms creates a partnership, joint venture,
                employment, or agency relationship between you and TrainDrop.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Force majeure.
                </span>{" "}
                TrainDrop is not liable for any failure or delay in
                performance due to causes beyond our reasonable control,
                including internet outages, natural disasters, or third-party
                service failures.
              </li>
            </ul>
          </section>

          <section id="s21">
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              21. Contact
            </h2>
            <p className="mb-3">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-surface border border-[var(--color-border)] rounded-xl p-5 space-y-1">
              <p>
                <span className="font-medium text-text-primary">Email:</span>{" "}
                support@traindrop.app
              </p>
              <p>
                <span className="font-medium text-text-primary">Location:</span>{" "}
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
