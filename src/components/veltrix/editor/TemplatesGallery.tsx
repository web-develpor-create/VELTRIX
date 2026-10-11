"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Search, Sparkles } from "lucide-react";

export function TemplatesGallery() {
  const { user, openAuth, setView, setEditingWebsiteId } = useAppStore();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [picking, setPicking] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = TEMPLATES.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s) || t.category.includes(s);
    }
    return true;
  });

  useEffect(() => {
    if (picking) {
      const tpl = TEMPLATES.find((t) => t.id === picking);
      setName(tpl?.name || "");
      setSlug("");
    }
  }, [picking]);

  const create = async () => {
    if (!user) {
      openAuth("signup");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, template: picking, slug: slug || name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not create website");
        return;
      }
      toast.success("Website created. Opening the editor…");
      setEditingWebsiteId(data.website.id);
      setPicking(null);
      setView("editor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pick a template</h1>
          <p className="mt-2 text-muted-foreground">
            Every template is fully editable in the visual builder. You can change colors, text, images, and sections.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c.id
                    ? "veltrix-bg-gradient border-transparent text-white"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setPicking(t.id)}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 text-left transition-all hover:border-border hover:bg-card/60 hover:veltrix-glow-sm"
            >
              <div
                className="relative aspect-[16/10] w-full overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}11)` }}
              >
                <div className="absolute inset-0 veltrix-grid opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-90 transition-transform group-hover:scale-110">{t.thumbnail}</span>
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

        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            No templates match your search.
          </div>
        )}
      </div>

      {/* Pick-name dialog */}
      <Dialog open={!!picking} onOpenChange={(o) => !o && setPicking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-veltrix-purple" />
              Name your website
            </DialogTitle>
            <DialogDescription>
              You can rename it later. The URL slug determines your <code className="text-xs">yourslug.netlify.app</code> subdomain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Website name</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Site"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-slug">URL slug (optional)</Label>
              <Input
                id="tpl-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-awesome-site"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and dashes only.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPicking(null)}>Cancel</Button>
            <Button onClick={create} disabled={busy || !name.trim()} className="veltrix-bg-gradient text-white">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & open editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
