"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 39,
    annualTotal: 468,
    annualSavings: 120,
    description: "For solo operators and small crews.",
    included: [
      "Up to 10 team members",
      "Up to 10 training modules",
      "Up to 3 training tracks",
      "Video upload + AI transcription + SOP generation",
      "Basic completion tracking",
      "Email delivery to employees",
      "Public share links",
    ],
    excluded: [
      "Advanced analytics & reporting",
      "PDF/DOCX import",
      "AI SOP editing & regeneration",
    ],
    popular: false,
  },
  {
    name: "Growth",
    monthlyPrice: 99,
    annualPrice: 79,
    annualTotal: 948,
    annualSavings: 240,
    description: "For businesses actively training growing crews.",
    included: [
      "Everything in Starter",
      "Up to 30 team members",
      "Unlimited training modules & tracks",
      "Advanced analytics (time spent, reports)",
      "PDF/DOCX import for existing SOPs",
      "AI-powered SOP editing & regeneration",
    ],
    excluded: [
      "Custom branding",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Scale",
    monthlyPrice: 199,
    annualPrice: 159,
    annualTotal: 1908,
    annualSavings: 480,
    description: "For established operations with multiple crews.",
    included: [
      "Everything in Growth",
      "Up to 75 team members",
      "Custom branding (your logo on employee pages)",
      "Priority support (4-hour email response)",
      "Bulk employee import (CSV)",
    ],
    excluded: [],
    popular: false,
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, cancel anytime with no penalties.",
  },
  {
    q: "What happens after the free trial?",
    a: "You choose a plan or your account pauses. No surprise charges.",
  },
  {
    q: "Do my employees need to pay?",
    a: "No, employee access is always free.",
  },
  {
    q: "Is there a contract?",
    a: "No contracts. Monthly or annual, your choice.",
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <>
      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-text-secondary text-center mb-8">
            30-day free trial on every plan. No credit card required.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-14">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium transition-colors ${
                !annual ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                annual ? "bg-accent" : "bg-[var(--color-border)]"
              }`}
              role="switch"
              aria-checked={annual}
              aria-label="Toggle billing period"
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform duration-200 ${
                  annual ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                annual ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Annual
              <span className="bg-accent/15 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
                2 months free
              </span>
            </button>
          </div>

          {/* Plan cards */}
          <div className="grid lg:grid-cols-3 gap-6 items-center">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  plan.popular
                    ? "bg-surface border-2 border-accent shadow-[0_0_48px_-8px_rgba(0,207,255,0.18)] scale-[1.03] z-10"
                    : "bg-surface border border-[var(--color-border)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-background text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-bold text-text-primary">
                      ${annual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-text-secondary text-sm pb-1.5">/mo</span>
                  </div>
                  {annual ? (
                    <p className="text-xs text-text-secondary mt-1">
                      Billed ${plan.annualTotal.toLocaleString()}/yr &middot; save ${plan.annualSavings}/yr
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary mt-1">Billed monthly</p>
                  )}
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {plan.included.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                  {plan.excluded.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Minus className="h-4 w-4 text-text-secondary/30 shrink-0 mt-0.5" />
                      <span className="text-text-secondary/30">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div>
                  <Link href="/signup">
                    <Button
                      variant={plan.popular ? "primary" : "secondary"}
                      size="md"
                      className="w-full"
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-text-secondary mt-2">
                    No credit card required
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-10">
            Common questions
          </h2>
          <div className="flex flex-col divide-y divide-[var(--color-border)]">
            {faqs.map(({ q, a }) => (
              <div key={q} className="py-5">
                <p className="font-semibold text-text-primary mb-1.5">{q}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
