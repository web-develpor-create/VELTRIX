"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Link2,
  Unlink,
  Loader2,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  LifeBuoy,
  Send,
} from "lucide-react";

export function Settings() {
  const { user, openAuth } = useAppStore();
  const [tab, setTab] = useState("hosting");

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card>
          <CardContent className="py-10 text-center">
            <p>Please sign in.</p>
            <Button onClick={() => openAuth("login")} className="mt-4 veltrix-bg-gradient text-white">
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage your hosting connection, account, and support requests.</p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="hosting"><Link2 className="mr-1 h-3 w-3" /> Hosting</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="support"><LifeBuoy className="mr-1 h-3 w-3" /> Support</TabsTrigger>
        </TabsList>

        <TabsContent value="hosting" className="mt-4">
          <HostingSettings />
        </TabsContent>
        <TabsContent value="account" className="mt-4">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="support" className="mt-4">
          <SupportSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HostingSettings() {
  const [conn, setConn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hosting");
      if (res.ok) {
        const data = await res.json();
        setConn(data.connection);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/hosting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, provider: "netlify" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not connect");
        return;
      }
      toast.success("Netlify connected", { description: `Account: ${data.connection.providerEmail}` });
      setToken("");
      await load();
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Netlify? You won't be able to publish until you reconnect.")) return;
    try {
      await fetch("/api/hosting", { method: "DELETE" });
      toast.success("Disconnected");
      await load();
    } catch {}
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-32 rounded-xl bg-secondary" /><div className="h-32 rounded-xl bg-secondary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Status card */}
      <Card className={conn ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${conn ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                {conn ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-amber-400" />}
              </div>
              <div>
                <p className="font-semibold">
                  {conn ? `Connected to ${conn.provider}` : "Not connected"}
                </p>
                {conn ? (
                  <>
                    <p className="text-sm text-muted-foreground">{conn.providerEmail || "Netlify account"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connected {new Date(conn.connectedAt).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect your Netlify account to publish websites.
                  </p>
                )}
              </div>
            </div>
            {conn && (
              <Button variant="outline" size="sm" onClick={disconnect}>
                <Unlink className="mr-1 h-3 w-3" /> Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connect form */}
      {!conn && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" /> Connect Netlify
            </CardTitle>
            <CardDescription>
              Create a free Netlify account, then generate a personal access token to paste below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="mb-4 space-y-2 rounded-lg border border-border/40 bg-secondary/30 p-4 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-veltrix-indigo">1.</span>
                <span>Go to <a href="https://app.netlify.com/signup" target="_blank" rel="noopener" className="text-veltrix-indigo underline">app.netlify.com/signup</a> and create a free account.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-veltrix-indigo">2.</span>
                <span>Open <a href="https://app.netlify.com/user/applications#personal-access-tokens" target="_blank" rel="noopener" className="text-veltrix-indigo underline">User settings → Applications → Personal access tokens</a> <ExternalLink className="inline h-3 w-3" /></span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-veltrix-indigo">3.</span>
                <span>Click "New access token", give it a description like "VELTRIX", and copy the token.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-veltrix-indigo">4.</span>
                <span>Paste it below. Veltrix encrypts it at rest and only uses it to deploy sites into YOUR account.</span>
              </li>
            </ol>
            <div className="space-y-3">
              <div>
                <Label htmlFor="netlify-token">Netlify personal access token</Label>
                <Input
                  id="netlify-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="nfp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono"
                />
              </div>
              <Button onClick={connect} disabled={!token.trim() || connecting} className="veltrix-bg-gradient text-white">
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                Connect Netlify
              </Button>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                Your token is encrypted with AES-256-GCM and stored only on Veltrix's server. It is never exposed to the browser after submission. You can revoke it any time from Netlify.
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* How publishing works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How publishing works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. You click <span className="font-medium text-foreground">Publish</span> on a website.</p>
          <p>2. Veltrix renders your website's content into a single self-contained HTML file.</p>
          <p>3. Veltrix calls Netlify's official API (<code className="text-xs">POST /api/v1/sites/:id/deploys</code>) to create a deploy in your account.</p>
          <p>4. Netlify returns the real <code className="text-xs">ssl_url</code> (e.g. <code className="text-xs">https://yoursite.netlify.app</code>).</p>
          <p>5. Veltrix saves the URL in the database and shows it in your dashboard.</p>
          <p className="rounded-md bg-secondary/40 p-3 text-xs">
            ⚠️ Netlify's free plan: 100 GB/month bandwidth, 300 build minutes/month, unlimited sites. Veltrix has no separate quotas — your only limits are Netlify's.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountSettings() {
  const { user, setUser } = useAppStore();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      // Reuse a small admin-less profile update path: patch via /api/auth/me (we'll add a tiny PUT)
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        toast.error("Could not save");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      toast.success("Profile updated");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled />
          <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed in this version.</p>
        </div>
        <div>
          <Label>Display name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{user?.role}</Badge>
          <span className="text-xs text-muted-foreground">
            {user?.role === "admin" ? "Admins can access the admin panel." : "Standard user."}
          </span>
        </div>
        <Button onClick={save} disabled={saving} className="veltrix-bg-gradient text-white">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

export function SupportSettings() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support");
      if (res.ok) setRequests((await res.json()).requests);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, category, priority }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not submit");
        return;
      }
      toast.success("Support request submitted");
      setSubject("");
      setMessage("");
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" /> New support request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} placeholder="Brief summary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="general">General</option>
                  <option value="deployment">Deployment</option>
                  <option value="billing">Billing</option>
                  <option value="bug">Bug</option>
                  <option value="abuse">Abuse report</option>
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} placeholder="Describe your issue in detail" />
            </div>
            <Button type="submit" disabled={sending} className="veltrix-bg-gradient text-white">
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No support requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{r.subject}</p>
                    <Badge variant="outline" className="capitalize">{r.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.category} · {r.priority} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm">{r.message}</p>
                  {r.response && (
                    <div className="mt-2 rounded-md bg-secondary/40 p-2 text-sm">
                      <p className="text-xs font-semibold text-veltrix-indigo">Response:</p>
                      <p>{r.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
