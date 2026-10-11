import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { renderSiteToHtml } from "@/lib/render-site";
import {
  getProviderForUser,
  getProvider,
  sanitizeSlug,
} from "@/lib/deploy";

const PublishSchema = z.object({
  websiteId: z.string().min(1),
  trigger: z.enum(["publish", "redeploy"]).default("publish"),
});

/**
 * Publishes a user's website to their connected Netlify (or Cloudflare Pages)
 * account. Returns the real provider-issued URL.
 *
 * Failure modes:
 *   - 401: not signed in
 *   - 400: website missing or invalid
 *   - 402: free plan limits exceeded (checked elsewhere)
 *   - 409: no hosting connection — user must connect a provider first
 *   - 502: provider API error (Netlify returned non-2xx)
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = PublishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { websiteId, trigger } = parsed.data;

    const website = await db.website.findUnique({ where: { id: websiteId } });
    if (!website || website.userId !== user.id) {
      return NextResponse.json({ error: "Website not found." }, { status: 404 });
    }

    const conn = await db.hostingConnection.findUnique({ where: { userId: user.id } });
    if (!conn) {
      return NextResponse.json(
        {
          error: "HOSTING_NOT_CONNECTED",
          message:
            "You need to connect a hosting provider (Netlify) before publishing. Open Settings → Hosting.",
        },
        { status: 409 }
      );
    }

    // Free-plan deployment quota
    const FREE_PLAN_DEPLOY_LIMIT = Number(process.env.FREE_PLAN_DEPLOY_LIMIT || 100);
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const deployCount = await db.deployment.count({
      where: { userId: user.id, createdAt: { gte: periodStart } },
    });
    if (deployCount >= FREE_PLAN_DEPLOY_LIMIT) {
      return NextResponse.json(
        {
          error: `Free plan monthly deploy limit reached (${FREE_PLAN_DEPLOY_LIMIT}/month).`,
        },
        { status: 402 }
      );
    }

    // Render the website to a single static HTML file
    const content = JSON.parse(website.content);
    const html = renderSiteToHtml({
      title: website.title || website.name,
      description: website.description || undefined,
      favicon: website.favicon || undefined,
      content,
    });

    // Find or create the Netlify site
    const client = getProviderForUser(conn);
    const lastDeploy = await db.deployment.findFirst({
      where: { websiteId, providerSiteId: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    const { siteId } = await client.ensureSite(
      sanitizeSlug(website.slug),
      website.name,
      lastDeploy?.providerSiteId
    );

    // Create the deployment
    const result = await client.deploy({
      html,
      slug: sanitizeSlug(website.slug),
      siteName: website.name,
      existingSiteId: siteId,
      siteId,
    });

    // Record it
    const deployment = await db.deployment.create({
      data: {
        websiteId,
        userId: user.id,
        provider: result.provider,
        providerSiteId: siteId,
        providerDeployId: result.deployId,
        url: result.url,
        sslUrl: result.sslUrl,
        state: result.state,
        errorMessage: result.errorMessage,
        trigger,
      },
    });

    // Upsert the free subdomain record
    await db.domain.upsert({
      where: { hostname: result.sslUrl.replace(/^https?:\/\//, "") },
      create: {
        websiteId,
        userId: user.id,
        kind: "subdomain",
        hostname: result.sslUrl.replace(/^https?:\/\//, ""),
        verified: true,
        sslProvisioned: true,
        status: "active",
      },
      update: { status: "active", sslProvisioned: true, verified: true },
    });

    await db.website.update({
      where: { id: websiteId },
      data: { status: "published", publishedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "website.publish",
        targetType: "website",
        targetId: websiteId,
        metadata: JSON.stringify({ deployId: deployment.id, url: result.sslUrl }),
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      },
    });

    return NextResponse.json({ deployment });
  } catch (err: any) {
    console.error("[publish]", err);
    return NextResponse.json(
      {
        error: "DEPLOY_FAILED",
        message: err?.message || "Publishing failed. Check your hosting connection.",
      },
      { status: 502 }
    );
  }
}
