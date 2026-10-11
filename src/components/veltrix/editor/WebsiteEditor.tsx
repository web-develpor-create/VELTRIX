"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { renderSiteToHtml } from "@/lib/render-site";
import type { SiteContent, SiteSection } from "@/lib/templates";
import {
  ArrowLeft,
  Eye,
  Save,
  Rocket,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Settings2,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Monitor,
} from "lucide-react";

interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  description: string | null;
  favicon: string | null;
  content: SiteContent;
  status: string;
  latestDeployment?: any;
}

const SECTION_TYPES: { type: SiteSection["type"]; label: string; icon: string }[] = [
  { type: "hero", label: "Hero", icon: "🎯" },
  { type: "features", label: "Features", icon: "✨" },
  { type: "stats", label: "Stats", icon: "📊" },
  { type: "gallery", label: "Gallery", icon: "🖼️" },
  { type: "text", label: "Text", icon: "📝" },
  { type: "cta", label: "Call to action", icon: "📣" },
  { type: "contact", label: "Contact", icon: "✉️" },
  { type: "menu", label: "Menu", icon: "🍽️" },
  { type: "posts", label: "Posts", icon: "📰" },
  { type: "products", label: "Products", icon: "🛍️" },
];

export function WebsiteEditor() {
  const { editingWebsiteId, setView, user, openAuth } = useAppStore();
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"sections" | "settings" | "preview">("sections");

  const load = useCallback(async () => {
    if (!editingWebsiteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/websites/${editingWebsiteId}`);
      if (!res.ok) {
        toast.error("Could not load website");
        setView("dashboard");
        return;
      }
      const data = await res.json();
      setWebsite(data.website);
      // Generate preview
      setPreviewHtml(
        renderSiteToHtml({
          title: data.website.title || data.website.name,
          description: data.website.description || undefined,
          favicon: data.website.favicon || undefined,
          content: data.website.content,
        })
      );
      if (data.website.content.sections[0]) {
        setSelectedSectionId(data.website.content.sections[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [editingWebsiteId, setView]);

  useEffect(() => {
    if (!user) {
      openAuth("login");
      return;
    }
    load();
  }, [user, load, openAuth]);

  // Regenerate preview when content changes
  useEffect(() => {
    if (!website) return;
    setPreviewHtml(
      renderSiteToHtml({
        title: website.title || website.name,
        description: website.description || undefined,
        favicon: website.favicon || undefined,
        content: website.content,
      })
    );
  }, [website?.content, website?.title, website?.description, website?.favicon, website?.name]);

  const updateContent = (updater: (c: SiteContent) => SiteContent) => {
    setWebsite((w) => (w ? { ...w, content: updater(w.content) } : w));
  };

  const updateSection = (id: string, patch: Partial<SiteSection>) => {
    updateContent((c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const addSection = (type: SiteSection["type"]) => {
    const newSection: SiteSection = {
      id: `${type}-${Date.now()}`,
      type,
      props: defaultPropsFor(type),
    };
    updateContent((c) => ({ ...c, sections: [...c.sections, newSection] }));
    setSelectedSectionId(newSection.id);
  };

  const removeSection = (id: string) => {
    updateContent((c) => ({ ...c, sections: c.sections.filter((s) => s.id !== id) }));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const moveSection = (id: string, direction: -1 | 1) => {
    updateContent((c) => {
      const idx = c.sections.findIndex((s) => s.id === id);
      if (idx < 0) return c;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= c.sections.length) return c;
      const sections = [...c.sections];
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return { ...c, sections };
    });
  };

  const save = async () => {
    if (!website) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/websites/${website.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: website.name,
          title: website.title,
          description: website.description,
          favicon: website.favicon,
          content: website.content,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Save failed");
        return;
      }
      toast.success("Saved");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!website) return;
    // Save first, then publish
    setPublishing(true);
    try {
      const saveRes = await fetch(`/api/websites/${website.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: website.name,
          title: website.title,
          description: website.description,
          favicon: website.favicon,
          content: website.content,
        }),
      });
      if (!saveRes.ok) {
        toast.error("Save before publish failed");
        return;
      }
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: website.id, trigger: "publish" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "HOSTING_NOT_CONNECTED") {
          toast.error("Connect Netlify first", { description: data.message });
          setView("settings");
          return;
        }
        toast.error(data.error || data.message || "Publish failed");
        return;
      }
      toast.success("Published!", {
        description: `Live at ${data.deployment.sslUrl}`,
        action: {
          label: "Open",
          onClick: () => window.open(data.deployment.sslUrl, "_blank"),
        },
      });
      await load();
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card>
          <CardContent className="py-10 text-center">
            <p>Website not found.</p>
            <Button onClick={() => setView("dashboard")} className="mt-4">Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedSection = website.content.sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("dashboard")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div>
            <Input
              value={website.name}
              onChange={(e) => setWebsite({ ...website, name: e.target.value })}
              className="border-0 bg-transparent px-0 text-xl font-bold shadow-none focus-visible:ring-0"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">
              Slug: <code>{website.slug}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
            Save draft
          </Button>
          <Button
            size="sm"
            onClick={publish}
            disabled={publishing}
            className="veltrix-bg-gradient text-white"
          >
            {publishing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Rocket className="mr-1 h-3 w-3" />}
            {website.status === "published" ? "Update live" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Live URL banner if published */}
      {website.status === "published" && website.latestDeployment?.sslUrl && (
        <Card className="mb-4 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">LIVE</span>
              <a
                href={website.latestDeployment.sslUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1 text-veltrix-indigo hover:underline"
              >
                {website.latestDeployment.sslUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setPublishing(true);
                try {
                  const res = await fetch(`/api/websites/${website.id}/redeploy`, { method: "POST" });
                  const data = await res.json();
                  if (!res.ok) {
                    toast.error(data.error || data.message || "Redeploy failed");
                    return;
                  }
                  toast.success("Redeployed");
                  await load();
                } finally {
                  setPublishing(false);
                }
              }}
              disabled={publishing}
            >
              {publishing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
              Redeploy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="sections">
            <Settings2 className="mr-1 h-3 w-3" /> Sections
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-1 h-3 w-3" /> Preview
          </TabsTrigger>
        </TabsList>

        {/* Sections tab */}
        <TabsContent value="sections" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left: section list */}
            <div className="space-y-3 lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {website.content.sections.map((s, i) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 rounded-lg border p-2 transition-colors cursor-pointer ${
                        selectedSectionId === s.id
                          ? "border-veltrix-indigo/60 bg-veltrix-indigo/10"
                          : "border-border/40 bg-card/40 hover:bg-card/60"
                      }`}
                      onClick={() => setSelectedSectionId(s.id)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm font-medium capitalize">
                        {s.type}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSection(s.id, -1); }}
                          disabled={i === 0}
                          className="rounded p-1 hover:bg-secondary disabled:opacity-30"
                          aria-label="Move up"
                        >↑</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSection(s.id, 1); }}
                          disabled={i === website.content.sections.length - 1}
                          className="rounded p-1 hover:bg-secondary disabled:opacity-30"
                          aria-label="Move down"
                        >↓</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeSection(s.id); }}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                          aria-label="Remove section"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <AddSectionMenu onAdd={addSection} />
                </CardContent>
              </Card>

              {/* Theme card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Theme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Primary color</Label>
                    <Input
                      type="color"
                      value={website.content.theme.primary}
                      onChange={(e) => updateContent((c) => ({ ...c, theme: { ...c.theme, primary: e.target.value } }))}
                      className="mt-1 h-8 p-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Accent color</Label>
                    <Input
                      type="color"
                      value={website.content.theme.accent}
                      onChange={(e) => updateContent((c) => ({ ...c, theme: { ...c.theme, accent: e.target.value } }))}
                      className="mt-1 h-8 p-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Background</Label>
                    <Input
                      type="color"
                      value={website.content.theme.background}
                      onChange={(e) => updateContent((c) => ({ ...c, theme: { ...c.theme, background: e.target.value } }))}
                      className="mt-1 h-8 p-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Text color</Label>
                    <Input
                      type="color"
                      value={website.content.theme.text}
                      onChange={(e) => updateContent((c) => ({ ...c, theme: { ...c.theme, text: e.target.value } }))}
                      className="mt-1 h-8 p-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: editor for selected section + preview */}
            <div className="space-y-4 lg:col-span-2">
              {selectedSection ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="capitalize">Edit: {selectedSection.type}</span>
                      <Button size="sm" variant="ghost" onClick={() => setPreviewHtml(previewHtml)}>
                        <Eye className="mr-1 h-3 w-3" /> Auto-saves on Save
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionEditor section={selectedSection} onChange={(patch) => updateSection(selectedSection.id, patch)} />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Select a section to edit, or add a new one.
                  </CardContent>
                </Card>
              )}

              {/* Live preview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Live preview</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={previewMode === "desktop" ? "default" : "ghost"}
                        onClick={() => setPreviewMode("desktop")}
                        className="h-7 w-7 p-0"
                      >
                        <Monitor className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={previewMode === "mobile" ? "default" : "ghost"}
                        onClick={() => setPreviewMode("mobile")}
                        className="h-7 w-7 p-0"
                      >
                        <Smartphone className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="overflow-hidden rounded-lg border border-border/40 bg-white"
                    style={{ width: previewMode === "mobile" ? 390 : "100%", margin: previewMode === "mobile" ? "0 auto" : undefined }}
                  >
                    <iframe
                      srcDoc={previewHtml}
                      title="preview"
                      className="h-[600px] w-full bg-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Site metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="title">Browser title</Label>
                  <Input
                    id="title"
                    value={website.title || ""}
                    onChange={(e) => setWebsite({ ...website, title: e.target.value })}
                    placeholder="My Awesome Site — Home"
                  />
                </div>
                <div>
                  <Label htmlFor="desc">Meta description (for SEO)</Label>
                  <Textarea
                    id="desc"
                    rows={3}
                    value={website.description || ""}
                    onChange={(e) => setWebsite({ ...website, description: e.target.value })}
                    placeholder="A short description that appears in search results and link previews."
                  />
                </div>
                <div>
                  <Label htmlFor="favicon">Favicon URL (optional)</Label>
                  <Input
                    id="favicon"
                    value={website.favicon || ""}
                    onChange={(e) => setWebsite({ ...website, favicon: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Save settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">URL & publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={website.slug}
                    onChange={(e) => setWebsite({ ...website, slug: e.target.value })}
                    onBlur={save}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Determines your <code>yourslug.netlify.app</code> subdomain (only takes effect on next publish).
                  </p>
                </div>
                <div className="rounded-md bg-secondary/40 p-3 text-xs">
                  <p className="font-semibold">Status: <span className="capitalize">{website.status}</span></p>
                  {website.latestDeployment && (
                    <p className="mt-1 text-muted-foreground">
                      Last deploy: {website.latestDeployment.state} — {new Date(website.latestDeployment.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview tab */}
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Full preview</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={previewMode === "desktop" ? "default" : "ghost"}
                    onClick={() => setPreviewMode("desktop")}
                    className="h-7 w-7 p-0"
                  >
                    <Monitor className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === "mobile" ? "default" : "ghost"}
                    onClick={() => setPreviewMode("mobile")}
                    className="h-7 w-7 p-0"
                  >
                    <Smartphone className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-hidden rounded-lg border border-border/40 bg-white"
                style={{ width: previewMode === "mobile" ? 390 : "100%", margin: previewMode === "mobile" ? "0 auto" : undefined }}
              >
                <iframe srcDoc={previewHtml} title="full preview" className="h-[700px] w-full bg-white" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddSectionMenu({ onAdd }: { onAdd: (type: SiteSection["type"]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(!open)}
      >
        <Plus className="mr-1 h-3 w-3" /> Add section
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 grid w-full grid-cols-2 gap-1 rounded-lg border border-border/60 bg-popover p-2 shadow-lg">
            {SECTION_TYPES.map((s) => (
              <button
                key={s.type}
                onClick={() => {
                  onAdd(s.type);
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-md p-2 text-left text-xs hover:bg-secondary"
              >
                <span className="text-base">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SectionEditor({ section, onChange }: { section: SiteSection; onChange: (patch: Partial<SiteSection>) => void }) {
  const setProp = (key: string, value: any) => onChange({ props: { ...section.props, [key]: value } });

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Eyebrow</Label>
            <Input value={section.props.eyebrow || ""} onChange={(e) => setProp("eyebrow", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Textarea rows={2} value={section.props.title || ""} onChange={(e) => setProp("title", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Subtitle</Label>
            <Textarea rows={3} value={section.props.subtitle || ""} onChange={(e) => setProp("subtitle", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Button text</Label>
              <Input value={section.props.ctaText || ""} onChange={(e) => setProp("ctaText", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Button link</Label>
              <Input value={section.props.ctaHref || ""} onChange={(e) => setProp("ctaHref", e.target.value)} />
            </div>
          </div>
        </div>
      );
    case "features":
    case "stats":
    case "gallery":
    case "posts":
    case "products":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Section title</Label>
            <Input value={section.props.title || ""} onChange={(e) => setProp("title", e.target.value)} />
          </div>
          {section.props.subtitle !== undefined && (
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Input value={section.props.subtitle || ""} onChange={(e) => setProp("subtitle", e.target.value)} />
            </div>
          )}
          <div>
            <Label className="text-xs">Items</Label>
            <div className="space-y-2">
              {(section.props.items || []).map((item: any, i: number) => (
                <div key={i} className="rounded-md border border-border/40 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Item {i + 1}</span>
                    <button
                      onClick={() => setProp("items", section.props.items.filter((_: any, j: number) => j !== i))}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-1 space-y-1.5">
                    {Object.entries(item).map(([k, v]) => (
                      <div key={k}>
                        <Label className="text-[10px] uppercase">{k}</Label>
                        <Input
                          value={String(v ?? "")}
                          onChange={(e) => {
                            const newItems = [...section.props.items];
                            newItems[i] = { ...newItems[i], [k]: e.target.value };
                            setProp("items", newItems);
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const sample = section.props.items?.[0]
                    ? Object.fromEntries(Object.keys(section.props.items[0]).map((k) => [k, ""]))
                    : {};
                  setProp("items", [...(section.props.items || []), sample]);
                }}
              >
                <Plus className="mr-1 h-3 w-3" /> Add item
              </Button>
            </div>
          </div>
        </div>
      );
    case "text":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={section.props.title || ""} onChange={(e) => setProp("title", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea rows={6} value={section.props.body || ""} onChange={(e) => setProp("body", e.target.value)} />
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={section.props.title || ""} onChange={(e) => setProp("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Button text</Label>
              <Input value={section.props.ctaText || ""} onChange={(e) => setProp("ctaText", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Button link</Label>
              <Input value={section.props.ctaHref || ""} onChange={(e) => setProp("ctaHref", e.target.value)} />
            </div>
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={section.props.title || ""} onChange={(e) => setProp("title", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={section.props.email || ""} onChange={(e) => setProp("email", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={section.props.phone || ""} onChange={(e) => setProp("phone", e.target.value)} />
          </div>
        </div>
      );
    case "menu":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={section.props.title || ""} onChange={(e) => setProp("title", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Menu sections (JSON)</Label>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              value={JSON.stringify(section.props.sections || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setProp("sections", parsed);
                } catch {
                  // ignore — user is mid-edit
                }
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Edit as JSON. Each section: <code>{"{ name, items: [{ name, price, desc }] }"}</code>
            </p>
          </div>
        </div>
      );
    default:
      return <p className="text-sm text-muted-foreground">No editor for this section type.</p>;
  }
}

function defaultPropsFor(type: SiteSection["type"]): Record<string, any> {
  switch (type) {
    case "hero":
      return {
        eyebrow: "New section",
        title: "Your headline here",
        subtitle: "Tell visitors what makes you different.",
        ctaText: "Learn more",
        ctaHref: "#",
      };
    case "features":
      return {
        title: "Features",
        items: [
          { icon: "✨", title: "Feature one", text: "Describe it here." },
          { icon: "⚡", title: "Feature two", text: "Describe it here." },
          { icon: "🎯", title: "Feature three", text: "Describe it here." },
        ],
      };
    case "stats":
      return {
        title: "By the numbers",
        items: [
          { value: "100+", label: "Customers" },
          { value: "4.9★", label: "Rating" },
          { value: "24/7", label: "Support" },
        ],
      };
    case "gallery":
      return {
        title: "Gallery",
        items: [
          { title: "Item 1", subtitle: "Subtitle", color: "#6366f1" },
          { title: "Item 2", subtitle: "Subtitle", color: "#a855f7" },
        ],
      };
    case "text":
      return { title: "About", body: "Write something about yourself or your business." };
    case "cta":
      return { title: "Ready to get started?", ctaText: "Contact us", ctaHref: "#" };
    case "contact":
      return { title: "Contact", email: "you@example.com", phone: "" };
    case "menu":
      return {
        title: "Menu",
        sections: [{ name: "Starters", items: [{ name: "Item", price: "$10", desc: "Description" }] }],
      };
    case "posts":
      return {
        title: "Latest posts",
        items: [{ title: "Post title", date: "2026-01-01", excerpt: "Excerpt." }],
      };
    case "products":
      return {
        title: "Products",
        items: [{ name: "Product", price: "$20", color: "#cccccc" }],
      };
    default:
      return {};
  }
}
