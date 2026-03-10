import Link from "next/link";
import {
  Video,
  FileText,
  Share2,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Layers,
  PenLine,
  Link2,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-[var(--color-border)] rounded-full text-xs text-text-secondary font-medium mb-8">
            <Zap className="h-3 w-3 text-accent" />
            AI-powered employee training for small businesses
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary leading-tight mb-6">
            Stop{" "}
            <span className="text-accent">explaining</span>{" "}
            the same
            <br />
            thing every time you hire
          </h1>

          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
            Record a quick video on your phone. TrainDrop turns it into a
            complete training module — AI-written SOP, auto-captions, and
            tracking that shows you who actually finished.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/signup">
              <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-text-secondary">
            {["Free to start", "3-minute setup", "No employee accounts needed"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-[var(--color-border)] py-5 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16">
          {[
            { emoji: "🏢", text: "Built for small businesses" },
            { emoji: "📍", text: "Built in Lincoln, NE" },
          ].map(({ emoji, text }, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
              <span>{emoji}</span>
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Pain points */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-3">
            You know your business. But training
            <br className="hidden sm:block" />
            new hires is eating your week.
          </h2>
          <p className="text-text-secondary text-center mb-12">Sound familiar?</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              "You trained someone last week and they're already doing it wrong",
              "Every new hire shadows you for a week instead of learning from a system",
              "You have a Google Doc that nobody reads",
              "You've explained the same process 40 times to 40 different people",
              "You're the only one who knows how half your business actually runs",
              "\"I'll make a training video someday\" has been the plan for 3 years",
            ].map((pain, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-4 bg-surface border border-[var(--color-border)] rounded-xl"
              >
                <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-text-secondary leading-relaxed">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-3">
            From messy video to complete training. In minutes.
          </h2>
          <p className="text-text-secondary text-center mb-14">
            No production skills. No writing. No HR team required.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                icon: <Video className="h-5 w-5" />,
                title: "Record or type it out",
                desc: "Grab your phone and record yourself doing the task — messy, unscripted, unedited. Or paste your rough notes. Either works.",
              },
              {
                step: "02",
                icon: <Zap className="h-5 w-5" />,
                title: "AI builds the training module",
                desc: "TrainDrop transcribes your video, writes a clean step-by-step SOP, and adds burned-in captions. Ready in under 5 minutes.",
                highlight: true,
              },
              {
                step: "03",
                icon: <Share2 className="h-5 w-5" />,
                title: "Send it. Know who finished.",
                desc: "Email your team a unique link. They watch the video, read the steps, mark complete. You see exactly who did it — and who didn't.",
              },
            ].map(({ step, icon, title, desc, highlight }, i) => (
              <div
                key={step}
                className={`relative flex flex-col gap-4 p-6 bg-surface rounded-2xl border ${
                  highlight ? "border-accent/40" : "border-[var(--color-border)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl font-bold text-accent leading-none">{step}</span>
                  {i < 2 && (
                    <ArrowRight className="h-5 w-5 text-text-secondary hidden sm:block" />
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-2 leading-snug">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-3">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-text-secondary text-center mb-14">
            Built for owners who don&apos;t have time to learn new software.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <FileText className="h-5 w-5" />,
                title: "AI writes the SOP for you",
                desc: "Upload a video or paste your notes. AI turns it into a structured, step-by-step Standard Operating Procedure. Edit it however you want.",
              },
              {
                icon: <Video className="h-5 w-5" />,
                title: "Professional video with auto-captions",
                desc: "Burned-in captions make training accessible and watchable anywhere — even on a noisy job site with the sound off.",
              },
              {
                icon: <PenLine className="h-5 w-5" />,
                title: "Edit and refine your SOPs",
                desc: "The AI writes your SOP, but you're in control. Edit the markdown, tweak the steps, and make it yours.",
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: "See who finished. Stop guessing.",
                desc: "Every employee gets a unique link. You see who viewed it, who completed it, and exactly how long they spent. No more \"did you watch the training?\" conversations.",
              },
              {
                icon: <Layers className="h-5 w-5" />,
                title: "Bundle modules into full onboarding tracks",
                desc: "Group your training modules into a step-by-step track. New hires work through them in order. You see progress across every module.",
              },
              {
                icon: <Link2 className="h-5 w-5" />,
                title: "Employees just click a link",
                desc: "No apps to download. No passwords to forget. Your team gets an email with a link, they click it, and they're in. Works on any device.",
              },
            ].map(({ icon, title, desc }, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 p-5 bg-surface border border-[var(--color-border)] rounded-xl hover:border-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1.5 leading-snug">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-24 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-10">
            Built for any small business with processes to document
          </h2>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              "Cleaning Companies",
              "Restaurants & Cafes",
              "Hair Salons & Barbershops",
              "Auto Shops",
              "Landscaping & Lawn Care",
              "Retail Stores",
              "Gyms & Fitness Studios",
              "Property Management",
              "Childcare Centers",
              "Dog Grooming",
              "Plumbers & Electricians",
              "Medical & Dental Offices",
              "Food Trucks",
              "Franchises",
              "Hotels & Hospitality",
            ].map((industry) => (
              <span
                key={industry}
                className="px-3 py-1.5 bg-surface border border-[var(--color-border)] rounded-full text-sm text-text-secondary"
              >
                {industry}
              </span>
            ))}
          </div>
          <p className="text-text-primary font-medium">
            If you&apos;ve ever had to retrain someone from scratch, TrainDrop is for you.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-3">
            Simple pricing
          </h2>
          <p className="text-text-secondary text-center mb-14">
            Start free, upgrade when you need more.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-surface border border-[var(--color-border)] rounded-2xl p-6">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-text-primary">Free</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-text-primary">$0</span>
                  <span className="text-text-secondary ml-1 text-sm">/month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 mb-6">
                {[
                  "3 training modules",
                  "AI-generated SOP",
                  "Shareable links",
                  "Completion tracking",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="secondary" size="md" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-surface border-2 border-accent rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-accent text-background text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-5">
                <h3 className="text-lg font-bold text-text-primary">Pro</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-text-primary">$29</span>
                  <span className="text-text-secondary ml-1 text-sm">/month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 mb-6">
                {[
                  "Unlimited modules",
                  "Video upload & processing",
                  "Auto-captions burned in",
                  "Onboarding tracks",
                  "Per-employee completion tracking",
                  "Time spent analytics",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="primary" size="md" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4 leading-tight">
            Ready to stop{" "}
            <span className="text-accent">re-training</span>
            <br />
            everyone from scratch?
          </h2>
          <p className="text-text-secondary mb-10">
            Create your first training module in 5 minutes. Free.
          </p>
          <Link href="/signup">
            <Button variant="primary" size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
                <span className="text-background text-xs font-bold">TD</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">TrainDrop</span>
            </div>
            <span className="text-xs text-text-secondary">Built in Lincoln, NE</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
              Terms
            </Link>
            <Link href="/login" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
              Log In
            </Link>
          </div>
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} TrainDrop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
