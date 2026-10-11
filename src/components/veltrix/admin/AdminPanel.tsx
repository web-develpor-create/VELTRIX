"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Globe,
  Rocket,
  AlertCircle,
  Shield,
  Activity,
  Search,
  Loader2,
  Server,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function AdminPanel() {
  const { user, openAuth, setView } = useAppStore();
  const [tab, setTab] = useState("overview");

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card>
          <CardContent className="py-10 text-center">
            <p>Please sign in.</p>
            <Button onClick={() => openAuth("login")} className="mt-4 veltrix-bg-gradient text-white">Sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-400" /> Admin access required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Your account doesn't have admin privileges. The first account created on a Veltrix deployment becomes the admin automatically.</p>
            <Button onClick={() => setView("dashboard")} className="mt-4">Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg veltrix-bg-gradient">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Platform-wide monitoring and moderation.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="overview"><Activity className="mr-1 h-3 w-3" /> Overview</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-3 w-3" /> Users</TabsTrigger>
          <TabsTrigger value="deployments"><Rocket className="mr-1 h-3 w-3" /> Deployments</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="system"><Server className="mr-1 h-3 w-3" /> System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><Overview /></TabsContent>
        <TabsContent value="users" className="mt-4"><UsersAdmin /></TabsContent>
        <TabsContent value="deployments" className="mt-4"><DeploymentsAdmin /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AuditLog /></TabsContent>
        <TabsContent value="system" className="mt-4"><SystemHealth /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile icon={Users} label="Users" value={data.stats.users} color="text-blue-400" />
        <StatTile icon={Globe} label="Websites" value={data.stats.websites} color="text-purple-400" />
        <StatTile icon={Rocket} label="Total deploys" value={data.stats.deployments} color="text-emerald-400" />
        <StatTile icon={AlertCircle} label="Failed deploys" value={data.stats.failedDeployments} color="text-rose-400" />
        <StatTile icon={Globe} label="Domains" value={data.stats.domains} color="text-cyan-400" />
        <StatTile icon={AlertCircle} label="Open support" value={data.stats.supportOpen} color="text-amber-400" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent failed deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentFailedDeployments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No failed deployments. 🎉</p>
          ) : (
            <div className="space-y-2">
              {data.recentFailedDeployments.map((d: any) => (
                <div key={d.id} className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{d.website?.name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">User: {d.user?.email}</p>
                  {d.errorMessage && (
                    <p className="mt-1 font-mono text-xs text-rose-300">{d.errorMessage.slice(0, 200)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent audit log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {data.auditRecent.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border/40 p-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{a.action}</Badge>
                  <span className="text-muted-foreground">{a.actor}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) setUsers((await res.json()).users);
    setLoading(false);
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/users?${params}`);
      if (cancelled) return;
      if (res.ok) setUsers((await res.json()).users);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [q, status]);

  const update = async (id: string, patch: { role?: string; status?: string }) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Update failed");
      return;
    }
    toast.success("User updated");
    await load();
  };

  const del = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/users/${deleteId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Delete failed");
      return;
    }
    toast.success("User deleted");
    setDeleteId(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>
            <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? "" : v); }}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={load}>Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Last login</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border/20 hover:bg-card/40">
                      <td className="p-3">
                        <div className="font-medium">{u.email}</div>
                        {u.name && <div className="text-xs text-muted-foreground">{u.name}</div>}
                      </td>
                      <td className="p-3">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className={u.role === "admin" ? "bg-veltrix-indigo/30 text-veltrix-indigo border-veltrix-indigo/40" : ""}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={
                          u.status === "active" ? "text-emerald-300 border-emerald-500/30" :
                          u.status === "suspended" ? "text-amber-300 border-amber-500/30" :
                          "text-rose-300 border-rose-500/30"
                        }>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true }) : "Never"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Select
                            value={u.status}
                            onValueChange={(v) => update(u.id, { status: v })}
                          >
                            <SelectTrigger className="h-7 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspend</SelectItem>
                              <SelectItem value="banned">Ban</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => setDeleteId(u.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user and all their websites, deployments, and domains. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DeploymentsAdmin() {
  const [deps, setDeps] = useState<any[]>([]);
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const params = state ? `?state=${state}` : "";
    const res = await fetch(`/api/admin/deployments${params}`);
    if (res.ok) setDeps((await res.json()).deployments);
    setLoading(false);
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = state ? `?state=${state}` : "";
      const res = await fetch(`/api/admin/deployments${params}`);
      if (cancelled) return;
      if (res.ok) setDeps((await res.json()).deployments);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [state]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3">
          <div className="flex gap-2">
            {["", "ready", "building", "error"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={state === s ? "default" : "outline"}
                onClick={() => setState(s)}
                className={state === s ? "veltrix-bg-gradient text-white" : ""}
              >
                {s || "All"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="veltrix-scroll max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Website</th>
                  <th className="p-3">User</th>
                  <th className="p-3">State</th>
                  <th className="p-3">URL</th>
                  <th className="p-3">When</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : deps.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No deployments.</td></tr>
                ) : (
                  deps.map((d) => (
                    <tr key={d.id} className="border-b border-border/20 hover:bg-card/40">
                      <td className="p-3 font-medium">{d.website?.name || "—"}</td>
                      <td className="p-3 text-xs">{d.user?.email}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={
                          d.state === "ready" ? "text-emerald-300 border-emerald-500/30" :
                          d.state === "error" ? "text-rose-300 border-rose-500/30" :
                          "text-amber-300 border-amber-500/30"
                        }>
                          {d.state}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">
                        {d.sslUrl ? (
                          <a href={d.sslUrl} target="_blank" rel="noopener" className="text-veltrix-indigo hover:underline">
                            {d.sslUrl.replace(/^https?:\/\//, "")}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/audit").then((r) => r.json()).then((d) => setLogs(d.logs || []));
  }, []);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="veltrix-scroll max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Target</th>
                <th className="p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No audit entries.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-border/20 hover:bg-card/40">
                    <td className="p-3"><Badge variant="outline" className="font-mono text-xs">{l.action}</Badge></td>
                    <td className="p-3 text-xs">{l.actor}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {l.targetType} {l.targetId && `· ${l.targetId.slice(0, 8)}…`}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemHealth() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/health", { method: "POST" }).then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Environment</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(data.env).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <Badge variant="outline" className="font-mono text-xs">{String(v)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Counts</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(data.counts).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono">{String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm">
          <p className="font-medium">Configuration notes</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• <code>HOSTING_PROVIDER</code> defaults to <code>netlify</code>. Set to <code>cloudflare_pages</code> to use Cloudflare instead.</li>
            <li>• <code>ENCRYPTION_KEY</code> should be a 32+ char random string in production. Used to encrypt user hosting tokens at rest.</li>
            <li>• <code>EMAIL_SERVER</code> + <code>EMAIL_FROM</code> enable real password reset emails. Without them, dev mode exposes the reset token in the API response.</li>
            <li>• <code>CF_ACCOUNT_ID</code> required only if <code>HOSTING_PROVIDER=cloudflare_pages</code>.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
