"use client";

import { Check, X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to build and host real websites.",
    features: [
      "Up to 5 websites",
      "100 deploys / month",
      "Provider-owned subdomain (yoursite.netlify.app)",
      "Visual editor + 7 templates",
      "Draft history & restore",
      "Custom domain (your own domain)",
      "HTTPS via provider",
      "Community support",
    ],
    notIncluded: [
      "Team collaboration",
      "Custom server-side code",
      "Removal of VELTRIX footer badge",
    ],
    cta: "Start free",
    highlight: true,
  },
  {
    name: "Honest limits",
    price: "Transparent",
    period: "",
    description: "What we can and cannot do on free tiers — explained openly.",
    features: [
      "Free subdomains only on the free tier",
      "Build minutes subject to Netlify's free plan (300 min/mo)",
      "Bandwidth subject to Netlify's free plan (100 GB/mo)",
      "Provider requires each user to have their own account",
      "Veltrix does not charge users — providers' terms apply",
    ],
    notIncluded: [
      "Free .com registration (no registrar offers this)",
      "Unlimited websites",
      "Permanent uptime SLA",
    ],
    cta: "Read the docs",
    highlight: false,
  },
];

export function Pricing() {
  const { openAuth, user, setView } = useAppStore();

  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-veltrix-purple">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Free. Honestly free.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Veltrix is free to use. Free hosting comes from Netlify's free tier via your own account — subject to their quotas, not ours.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 ${
                p.highlight
                  ? "veltrix-border-gradient veltrix-glow bg-card/60"
                  : "border-border/40 bg-card/40"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="veltrix-bg-gradient rounded-full px-3 py-1 text-xs font-semibold text-white">
                    Recommended
                  </div>
                </div>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                {p.period && <span className="text-sm text-muted-foreground">/{p.period}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>

              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
                {p.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-muted-foreground/70 line-through">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-7 w-full ${p.highlight ? "veltrix-bg-gradient text-white hover:opacity-90" : ""}`}
                variant={p.highlight ? "default" : "outline"}
                onClick={() => {
                  if (p.highlight) {
                    if (user) setView("dashboard");
                    else openAuth("signup");
                  } else {
                    setView("docs");
                  }
                }}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
          Veltrix never asks for your credit card. Publishing uses your own Netlify account's free tier — you can stay on Netlify's free plan indefinitely. If you exceed Netlify's quotas, upgrade directly with Netlify (not Veltrix).
        </p>
      </div>
    </section>
  );
}
