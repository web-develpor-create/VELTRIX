"use client";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/templates";
import { ArrowRight } from "lucide-react";

export function TemplatesPreview() {
  const { setView, openAuth, user } = useAppStore();

  const featured = TEMPLATES.slice(0, 6);

  return (
    <section id="templates" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 veltrix-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-veltrix-purple">
              Start from a template
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              7 professional templates, infinitely editable.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pick a starting point, then make it yours. Every section is editable in the visual builder.
            </p>
          </div>
          <Button variant="outline" onClick={() => setView("templates")} className="shrink-0">
            View all <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <button
              key={t.id}
              onClick={() => (user ? setView("templates") : openAuth("signup"))}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 text-left transition-all hover:border-border hover:bg-card/60 hover:veltrix-glow-sm"
            >
              <div
                className="relative aspect-[16/10] w-full overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}11)`,
                }}
              >
                <div className="absolute inset-0 veltrix-grid opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-90">{t.thumbnail}</span>
                </div>
                <div
                  className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: t.accent, color: "white" }}
                >
                  {t.category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
