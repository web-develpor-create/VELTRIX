"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is VELTRIX really free?",
    a: "Yes. Veltrix itself is free — no subscription, no credit card, no trial timer. Publishing uses Netlify's free hosting tier via your own Netlify account, which is also free. Netlify's free plan includes 100 GB/month bandwidth, 300 build minutes/month, and unlimited sites — more than enough for personal projects.",
  },
  {
    q: "Do I need my own Netlify account?",
    a: "Yes. To publish websites you need a free Netlify account and a Personal Access Token, which you create in your Netlify user settings. Veltrix uses that token to deploy sites into YOUR account. We never use Veltrix's own credentials to publish on your behalf — this respects Netlify's Terms of Service and keeps your sites under your control.",
  },
  {
    q: "What URL will my website get?",
    a: "Every publish returns the actual `yoursite.netlify.app` URL Netlify issues. The URL is real, hosted on Netlify's edge network, served over HTTPS, and yours to share. No fake URLs, no proxies, no Veltrix-branded wrappers.",
  },
  {
    q: "Can I use my own custom domain?",
    a: "Yes. Once you've published to a free subdomain, add a custom domain in the Domains tab. Veltrix generates the exact CNAME and TXT DNS records you need to add at your registrar, then verifies ownership with a real DNS-over-HTTPS lookup. SSL is provisioned automatically by Netlify once the DNS resolves.",
  },
  {
    q: "Why don't you offer free .com registration?",
    a: "Because no real registrar offers it. Domain registration costs money — typically $10-15/year for a .com. Any platform promising free .com registration is either losing money on you, locking you in, or hiding fees. We won't do that. Use Cloudflare Registrar (at-cost renewal), Namecheap, or Porkbun for cheap domains.",
  },
  {
    q: "What's the difference between Veltrix and Netlify?",
    a: "Netlify is the hosting provider. Veltrix is the website builder that deploys to Netlify for you. Think of Veltrix as the editor and Netlify as the server. You can always log into your Netlify account directly to see your sites, deploys, and analytics — Veltrix doesn't lock you in.",
  },
  {
    q: "Can I edit my website's HTML directly?",
    a: "Not yet — the visual editor works with structured sections (hero, features, gallery, menu, etc.). The HTML is generated for you and deployed as a single self-contained static file. We're working on a custom-code template for users who want full HTML/CSS/JS control.",
  },
  {
    q: "Is my data secure?",
    a: "Passwords are hashed with scrypt. Sessions are server-side cookies (httpOnly, Secure, SameSite=Lax). Your Netlify token is encrypted at rest with AES-256-GCM using a server-side key. Every API route validates ownership — you can never modify another user's websites, even by guessing IDs.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-veltrix-purple">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Honest answers.
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/40 bg-card/40"
            >
              <button
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium">{f.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
