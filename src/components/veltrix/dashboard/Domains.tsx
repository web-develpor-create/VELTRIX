"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Globe,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface DomainItem {
  id: string;
  kind: string;
  hostname: string;
  verified: boolean;
  sslProvisioned: boolean;
  status: string;
  verificationToken: string | null;
  dnsRecords: string | null;
  website?: { id: string; name: string; slug: string };
}

export function Domains() {
  const { user, openAuth } = useAppStore();
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newHostname, setNewHostname] = useState("");
  const [newWebsiteId, setNewWebsiteId] = useState("");
  const [websites, setWebsites] = useState<any[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, wRes] = await Promise.all([fetch("/api/domains"), fetch("/api/websites")]);
      if (dRes.ok) setDomains((await dRes.json()).domains);
      if (wRes.ok) setWebsites((await wRes.json()).websites);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: newHostname, websiteId: newWebsiteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not add domain");
        return;
      }
      toast.success("Domain added", { description: "Add the DNS records below to verify." });
      setNewHostname("");
      await load();
    } finally {
      setAdding(false);
    }
  };

  const verify = async (id: string) => {
    setVerifying(id);
    try {
      const res = await fetch(`/api/domains/${id}`, { method: "POST" });
      const data = await res.json();
      if (res.status === 202) {
        toast.error(data.error || "Not verified yet — DNS may take a few minutes.");
      } else if (res.ok) {
        toast.success("Domain verified!");
      } else {
        toast.error(data.error || "Verification failed");
      }
      await load();
    } finally {
      setVerifying(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this domain?")) return;
    try {
      await fetch(`/api/domains/${id}`, { method: "DELETE" });
      toast.success("Removed");
      await load();
    } catch {}
  };

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

  const subdomains = domains.filter((d) => d.kind === "subdomain");
  const customs = domains.filter((d) => d.kind === "custom");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
      <p className="mt-1 text-muted-foreground">Free subdomains from your hosting provider + custom domains you own.</p>

      {/* Free subdomains */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> Free subdomains
          </CardTitle>
          <CardDescription>Issued automatically by Netlify when you publish.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : subdomains.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No free subdomains yet. Publish a website to get one.
            </div>
          ) : (
            <div className="space-y-2">
              {subdomains.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/40 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <a href={`https://${d.hostname}`} target="_blank" rel="noopener" className="font-medium text-veltrix-indigo hover:underline">
                        {d.hostname}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {d.website?.name} · SSL {d.sslProvisioned ? "active" : "pending"}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom domains */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Add a custom domain
          </CardTitle>
          <CardDescription>Bring a domain you already own. We'll show you the exact DNS records to add.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <Label htmlFor="hostname">Domain</Label>
              <Input
                id="hostname"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                placeholder="shop.example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <select
                id="website"
                value={newWebsiteId}
                onChange={(e) => setNewWebsiteId(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm sm:w-48"
              >
                <option value="">Select…</option>
                {websites.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={adding} className="veltrix-bg-gradient text-white">
                {adding ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                Add
              </Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Only add domains you actually own. Adding a domain you don't control won't work — verification requires DNS access.
          </p>
        </CardContent>
      </Card>

      {/* Existing custom domains */}
      <div className="mt-4 space-y-3">
        {customs.length === 0 && !loading ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No custom domains yet.
            </CardContent>
          </Card>
        ) : (
          customs.map((d) => {
            const dns = d.dnsRecords ? JSON.parse(d.dnsRecords) : null;
            return (
              <Card key={d.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{d.hostname}</h3>
                        {d.verified ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-300 border-amber-500/30">
                            <AlertCircle className="mr-1 h-3 w-3" /> Pending verification
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Website: {d.website?.name || "—"}
                      </p>

                      {!d.verified && dns && (
                        <div className="mt-3 rounded-lg border border-border/40 bg-secondary/30 p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                            <ShieldCheck className="h-3 w-3" /> DNS records to add at your registrar
                          </p>
                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{dns.cname.type}</Badge>
                              <span className="text-foreground">{dns.cname.host}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-veltrix-indigo">{dns.cname.value}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{dns.txt.type}</Badge>
                              <span className="text-foreground">{dns.txt.host}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-veltrix-indigo break-all">{dns.txt.value}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Add both records, then click verify. DNS propagation can take 5-30 minutes.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!d.verified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verify(d.id)}
                          disabled={verifying === d.id}
                        >
                          {verifying === d.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                          Verify
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(d.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Honest disclaimer */}
      <Card className="mt-6 border-border/40 bg-secondary/20">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Honest notes about custom domains</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Veltrix does not sell or register domains. Use Cloudflare Registrar, Namecheap, or Porkbun for cheap registration.</li>
            <li>• HTTPS/SSL is provisioned automatically by Netlify once your DNS resolves — no extra setup needed.</li>
            <li>• Verification runs a real DNS-over-HTTPS TXT lookup via Cloudflare's public resolver.</li>
            <li>• You can also manage custom domains directly in your Netlify dashboard if you prefer.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
