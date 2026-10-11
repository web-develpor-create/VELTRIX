"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Globe,
  Rocket,
  FileEdit,
  AlertCircle,
  Link2,
  Plus,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Trash2,
  Copy,
  Eye,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface WebsiteItem {
  id: string;
  name: string;
  slug: string;
  template: string;
  title: string | null;
  status: string;
  updatedAt: string;
  publishedAt: string | null;
  latestDeployment: {
    id: string;
    state: string;
    url: string | null;
    sslUrl: string | null;
    errorMessage: string | null;
    createdAt: string;
  } | null;
  subdomain: string | null;
}

interface Stats {
  totalWebsites: number;
  publishedWebsites: number;
  draftWebsites: number;
  totalDeployments: number;
  failedDeployments: number;
  totalDomains: number;
  monthlyDeploys: number;
  limits: { websites: number; monthlyDeploys: number };
  hostingConnected: boolean;
  hostingProvider: string | null;
}

export function Dashboard() {
  const { user, setView, setEditingWebsiteId, openAuth } = useAppStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, webRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/websites"),
      ]);
      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (webRes.ok) setWebsites((await webRes.json()).websites);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePublish = async (id: string) => {
    setBusyAction(`pub-${id}`);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: id, trigger: "publish" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "HOSTING_NOT_CONNECTED") {
          toast.error("Connect Netlify first", { description: data.message });
          setView("settings");
        } else {
          toast.error(data.error || data.message || "Publish failed");
        }
        return;
      }
      toast.success("Published!", {
        description: `Live at ${data.deployment.sslUrl}`,
      });
      await load();
    } finally {
      setBusyAction(null);
    }
  };

  const handleRedeploy = async (id: string) => {
    setBusyAction(`re-${id}`);
    try {
      const res = await fetch(`/api/websites/${id}/redeploy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || "Redeploy failed");
        return;
      }
      toast.success("Redeployed", { description: `Live at ${data.deployment.sslUrl}` });
      await load();
    } finally {
      setBusyAction(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setBusyAction(`un-${id}`);
    try {
      const res = await fetch(`/api/websites/${id}/unpublish`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Unpublish failed");
        return;
      }
      toast.success("Unpublished");
      await load();
    } finally {
      setBusyAction(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusyAction(`dup-${id}`);
    try {
      const res = await fetch(`/api/websites/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Duplicate failed");
        return;
      }
      toast.success("Duplicated");
      await load();
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setBusyAction(`del-${deleteId}`);
    try {
      const res = await fetch(`/api/websites/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Delete failed");
        return;
      }
      toast.success("Website deleted");
      setDeleteId(null);
      await load();
    } finally {
      setBusyAction(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>You need an account to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => openAuth("login")} className="w-full veltrix-bg-gradient text-white">
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name || user.email.split("@")[0]}.
          </h1>
          <p className="mt-1 text-muted-foreground">Manage your websites and deployments.</p>
        </div>
        <Button onClick={() => setView("templates")} className="veltrix-bg-gradient text-white">
          <Plus className="mr-2 h-4 w-4" /> New website
        </Button>
      </div>

      {/* Stats grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Globe}
          label="Total websites"
          value={loading ? null : stats?.totalWebsites ?? 0}
          sub={loading ? null : `${stats?.limits.websites ?? 5} max`}
          color="text-blue-400"
        />
        <StatCard
          icon={Rocket}
          label="Published"
          value={loading ? null : stats?.publishedWebsites ?? 0}
          sub={loading ? null : `${stats?.draftWebsites ?? 0} drafts`}
          color="text-emerald-400"
        />
        <StatCard
          icon={TrendingUp}
          label="This month deploys"
          value={loading ? null : stats?.monthlyDeploys ?? 0}
          sub={loading ? null : `${stats?.limits.monthlyDeploys ?? 100} max`}
          color="text-purple-400"
        />
        <StatCard
          icon={AlertCircle}
          label="Failed deploys"
          value={loading ? null : stats?.failedDeployments ?? 0}
          sub={loading ? null : `${stats?.totalDeployments ?? 0} total`}
          color="text-rose-400"
        />
      </div>

      {/* Hosting banner */}
      {!loading && stats && !stats.hostingConnected && (
        <Card className="mt-6 border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Link2 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium">Connect Netlify to publish websites</p>
                <p className="text-sm text-muted-foreground">
                  You need a free Netlify account + personal access token to deploy websites.
                </p>
              </div>
            </div>
            <Button onClick={() => setView("settings")} variant="outline" className="shrink-0">
              Connect now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Websites list */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your websites</h2>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : websites.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No websites yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Pick a template and start building. Your first website could be live in under 5 minutes.
              </p>
              <Button onClick={() => setView("templates")} className="mt-6 veltrix-bg-gradient text-white">
                <Plus className="mr-2 h-4 w-4" /> Choose a template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {websites.map((w) => (
              <Card key={w.id} className="overflow-hidden transition-colors hover:bg-card/60">
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                  {/* Thumbnail */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: `linear-gradient(135deg, ${getTemplateAccent(w.template)}33, ${getTemplateAccent(w.template)}11)` }}
                  >
                    {getTemplateEmoji(w.template)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{w.name}</h3>
                      <StatusBadge status={w.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Updated {formatDistanceToNow(new Date(w.updatedAt), { addSuffix: true })}</span>
                      {w.subdomain && (
                        <a
                          href={`https://${w.subdomain}`}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center gap-1 text-veltrix-indigo hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {w.subdomain}
                        </a>
                      )}
                      {w.latestDeployment?.state === "error" && (
                        <span className="flex items-center gap-1 text-rose-400">
                          <AlertCircle className="h-3 w-3" /> Last deploy failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {w.status === "published" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRedeploy(w.id)}
                        disabled={busyAction?.endsWith(w.id)}
                      >
                        {busyAction === `re-${w.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                        Redeploy
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(w.id)}
                        disabled={busyAction?.endsWith(w.id)}
                        className="veltrix-bg-gradient text-white"
                      >
                        {busyAction === `pub-${w.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Rocket className="mr-1 h-3 w-3" />}
                        Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingWebsiteId(w.id);
                        setView("editor");
                      }}
                    >
                      <FileEdit className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDuplicate(w.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        {w.subdomain && (
                          <DropdownMenuItem asChild>
                            <a href={`https://${w.subdomain}`} target="_blank" rel="noopener">
                              <Eye className="mr-2 h-4 w-4" /> View live
                            </a>
                          </DropdownMenuItem>
                        )}
                        {w.status === "published" && (
                          <DropdownMenuItem onClick={() => handleUnpublish(w.id)}>
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(w.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this website?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the website from Veltrix and attempts to delete the linked Netlify site. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: number | null;
  sub: string | null;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="mt-2 text-3xl font-bold">
          {value === null ? <Skeleton className="h-9 w-12" /> : value}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{sub ?? <Skeleton className="h-3 w-16" />}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    published: { label: "Published", variant: "default" },
    draft: { label: "Draft", variant: "secondary" },
    unpublished: { label: "Unpublished", variant: "outline" },
  };
  const s = map[status] || { label: status, variant: "outline" as const };
  return (
    <Badge variant={s.variant} className={
      status === "published"
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        : ""
    }>
      {s.label}
    </Badge>
  );
}

function getTemplateAccent(id: string): string {
  const map: Record<string, string> = {
    "business-pro": "#3b82f6",
    "portfolio-lite": "#a855f7",
    "agency-studio": "#6366f1",
    "blog-clean": "#0ea5e9",
    "restaurant-menu": "#f97316",
    "landing-launch": "#10b981",
    "store-shop": "#ec4899",
  };
  return map[id] || "#6366f1";
}

function getTemplateEmoji(id: string): string {
  const map: Record<string, string> = {
    "business-pro": "💼",
    "portfolio-lite": "🎨",
    "agency-studio": "🚀",
    "blog-clean": "📝",
    "restaurant-menu": "🍽️",
    "landing-launch": "⚡",
    "store-shop": "🛍️",
  };
  return map[id] || "🌐";
}
