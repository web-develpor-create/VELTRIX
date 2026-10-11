"use client";

import { Server, Globe, Code, Shield, Zap, Rocket } from "lucide-react";

const FEATURES = [
  {
    icon: Code,
    title: "Visual editor",
    desc: "Edit text, colors, images, sections, and buttons with a live preview. No code required — but full control for power users.",
    accent: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Rocket,
    title: "One-click publish",
    desc: "Click Publish and VELTRIX deploys your site to your own Netlify account via the official Netlify API. Get back a real `yoursite.netlify.app` URL.",
    accent: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Globe,
    title: "Real free subdomains",
    desc: "Every publish returns the actual `*.netlify.app` URL Netlify issues. No fake URLs, no proxying — the site lives on Netlify's edge.",
    accent: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Shield,
    title: "Your account, your data",
    desc: "Each user connects their own Netlify account with a scoped personal access token. Veltrix never uses platform credentials to publish on your behalf.",
    accent: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Server,
    title: "Custom domains",
    desc: "Bring your own domain. Veltrix generates the exact DNS records to add and verifies ownership with a real DNS-over-HTTPS TXT lookup.",
    accent: "from-rose-500/20 to-red-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: Zap,
    title: "Versioned drafts",
    desc: "Save drafts, restore previous versions, duplicate, rename, redeploy, unpublish, and delete — every action is real and backed by the database.",
    accent: "from-cyan-500/20 to-sky-500/20",
    iconColor: "text-cyan-400",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-veltrix-purple">
            Everything you need
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            A complete platform, not a demo.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every feature is wired to a real backend with a real database. Nothing is mocked, nothing is fake, nothing is hidden behind a "coming soon" badge.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-6 transition-all hover:border-border hover:bg-card/60"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent}`}>
                <f.icon className={`h-5 w-5 ${f.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
