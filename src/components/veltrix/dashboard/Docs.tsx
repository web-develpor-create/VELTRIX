"use client";

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Rocket, Server, Shield, AlertTriangle, ExternalLink } from "lucide-react";

export function Docs() {
  const { setView, openAuth, user } = useAppStore();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-veltrix-indigo" />
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
      </div>
      <p className="mt-2 text-muted-foreground">
        Honest, no-bullshit docs. Everything you need to know to build and publish real websites.
      </p>

      <div className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Rocket className="h-4 w-4" /> Quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-semibold text-veltrix-indigo">1.</span> Create a free Veltrix account (top-right → Get started).</p>
            <p><span className="font-semibold text-veltrix-indigo">2.</span> Pick a template from the Templates gallery.</p>
            <p><span className="font-semibold text-veltrix-indigo">3.</span> Edit content, colors, and sections in the visual editor.</p>
            <p><span className="font-semibold text-veltrix-indigo">4.</span> Click <span className="font-medium">Settings → Hosting</span> and connect your Netlify account.</p>
            <p><span className="font-semibold text-veltrix-indigo">5.</span> Back in the editor, click <span className="font-medium">Publish</span>. Done — your site is live at <code>yoursite.netlify.app</code>.</p>
            <Button
              className="mt-2 veltrix-bg-gradient text-white"
              onClick={() => (user ? setView("templates") : openAuth("signup"))}
            >
              {user ? "Browse templates" : "Create your account"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Server className="h-4 w-4" /> How publishing works (technical)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Veltrix renders your website's structured content into a single self-contained HTML file with inline CSS — no external JS bundles, no build step on the published site.</p>
            <p>The publish flow:</p>
            <ol className="ml-4 list-decimal space-y-1.5">
              <li>Veltrix calls <code>POST /api/v1/sites</code> on Netlify to create or reuse a site in <em>your</em> account.</li>
              <li>Veltrix calls <code>POST /api/v1/sites/:site_id/deploys</code> with a SHA-1 file digest.</li>
              <li>If Netlify reports the file as missing (<code>required</code> array contains our digest), Veltrix uploads it via <code>PUT /api/v1/deploys/:deploy_id/files/index.html</code>.</li>
              <li>Netlify returns the real <code>ssl_url</code> (e.g. <code>https://veltrix-my-shop--main.netlify.app</code>).</li>
              <li>Veltrix saves the deployment record + URL in the database and displays it in your dashboard.</li>
            </ol>
            <p className="rounded-md bg-secondary/40 p-3 text-xs">
              Read the official docs:{" "}
              <a className="text-veltrix-indigo underline" href="https://docs.netlify.com/api/get-started/" target="_blank" rel="noopener">
                Netlify API <ExternalLink className="inline h-3 w-3" />
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" /> Security model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="ml-4 list-disc space-y-1">
              <li>Passwords hashed with scrypt (never stored as plaintext).</li>
              <li>Sessions are httpOnly, Secure, SameSite=Lax cookies stored server-side in the database.</li>
              <li>Your Netlify personal access token is encrypted at rest with AES-256-GCM.</li>
              <li>Every API route that touches user data validates ownership — you can never modify another user's websites.</li>
              <li>Admin endpoints check <code>role === "admin"</code> on the server, not just in the UI.</li>
              <li>All provider tokens are sent only to the Netlify API over HTTPS — never logged, never returned to the client.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-400" /> Honest limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="ml-4 list-disc space-y-1">
              <li>Free subdomains only — no free .com registration (no registrar offers it).</li>
              <li>Each user needs their own Netlify account. Veltrix can't share one platform account across all users — that would violate Netlify's ToS.</li>
              <li>Subject to Netlify's free plan quotas: 100 GB/month bandwidth, 300 build minutes/month, 500 deploys/month per site.</li>
              <li>The visual editor produces structured HTML — full custom HTML/JS server-side code is not supported in this version.</li>
              <li>Email verification requires you to configure an SMTP server. Without it, password reset tokens are returned in the API response for local testing.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
