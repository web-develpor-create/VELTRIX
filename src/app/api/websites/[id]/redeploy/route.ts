import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { renderSiteToHtml } from "@/lib/render-site";
import { getProviderForUser, sanitizeSlug } from "@/lib/deploy";

// Re-deploy (force a new deploy of the current saved content)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const website = await db.website.findUnique({ where: { id } });
  if (!website || website.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conn = await db.hostingConnection.findUnique({ where: { userId: user.id } });
  if (!conn) {
    return NextResponse.json(
      { error: "HOSTING_NOT_CONNECTED", message: "Connect a hosting provider first." },
      { status: 409 }
    );
  }

  try {
    const content = JSON.parse(website.content);
    const html = renderSiteToHtml({
      title: website.title || website.name,
      description: website.description || undefined,
      favicon: website.favicon || undefined,
      content,
    });

    const client = getProviderForUser(conn);
    const lastDeploy = await db.deployment.findFirst({
      where: { websiteId: id, providerSiteId: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    const { siteId } = await client.ensureSite(
      sanitizeSlug(website.slug),
      website.name,
      lastDeploy?.providerSiteId
    );

    const result = await client.deploy({
      html,
      slug: sanitizeSlug(website.slug),
      siteName: website.name,
      existingSiteId: siteId,
      siteId,
    });

    const deployment = await db.deployment.create({
      data: {
        websiteId: id,
        userId: user.id,
        provider: result.provider,
        providerSiteId: siteId,
        providerDeployId: result.deployId,
        url: result.url,
        sslUrl: result.sslUrl,
        state: result.state,
        errorMessage: result.errorMessage,
        trigger: "redeploy",
      },
    });

    await db.website.update({
      where: { id },
      data: { status: "published", publishedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "website.redeploy",
        targetType: "website",
        targetId: id,
        metadata: JSON.stringify({ deployId: deployment.id }),
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      },
    });

    return NextResponse.json({ deployment });
  } catch (err: any) {
    console.error("[redeploy]", err);
    return NextResponse.json(
      { error: "DEPLOY_FAILED", message: err?.message || "Redeploy failed." },
      { status: 502 }
    );
  }
}
