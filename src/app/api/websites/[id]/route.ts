import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeSlug } from "@/lib/deploy";

const UpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z.string().min(1).max(60).optional(),
  title: z.string().max(120).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  favicon: z.string().max(500).nullable().optional(),
  content: z.any().optional(),
});

async function getOwnedWebsite(id: string, userId: string) {
  const w = await db.website.findUnique({ where: { id } });
  if (!w || w.userId !== userId) return null;
  return w;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const w = await getOwnedWebsite(id, user.id);
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const versions = await db.siteVersion.findMany({
    where: { websiteId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const deployments = await db.deployment.findMany({
    where: { websiteId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const domains = await db.domain.findMany({ where: { websiteId: id } });

  return NextResponse.json({
    website: {
      ...w,
      content: JSON.parse(w.content),
    },
    versions: versions.map((v) => ({ ...v, content: JSON.parse(v.content) })),
    deployments,
    domains,
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const w = await getOwnedWebsite(id, user.id);
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    const updates: any = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.favicon !== undefined) updates.favicon = parsed.data.favicon;
    if (parsed.data.content !== undefined) {
      updates.content = JSON.stringify(parsed.data.content);
    }
    if (parsed.data.slug !== undefined) {
      const newSlug = sanitizeSlug(parsed.data.slug);
      // ensure unique
      const conflict = await db.website.findFirst({
        where: { userId: user.id, slug: newSlug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "That URL slug is already in use." }, { status: 409 });
      }
      updates.slug = newSlug;
    }

    const updated = await db.website.update({ where: { id }, data: updates });

    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "website.update",
        targetType: "website",
        targetId: id,
        metadata: JSON.stringify({ fields: Object.keys(updates) }),
      },
    });

    return NextResponse.json({
      website: { ...updated, content: JSON.parse(updated.content) },
    });
  } catch (err) {
    console.error("[websites/update]", err);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const w = await getOwnedWebsite(id, user.id);
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Best-effort: delete the linked Netlify site so the user doesn't have an
  // orphaned deployment on their own account.
  try {
    const conn = await db.hostingConnection.findUnique({ where: { userId: user.id } });
    if (conn) {
      const lastDeploy = await db.deployment.findFirst({
        where: { websiteId: id, providerSiteId: { not: null } },
        orderBy: { createdAt: "desc" },
      });
      if (lastDeploy?.providerSiteId) {
        const { getProviderForUser } = await import("@/lib/deploy");
        const client = getProviderForUser(conn);
        await client.deleteSite(lastDeploy.providerSiteId);
      }
    }
  } catch (err) {
    // Don't block local delete if remote delete fails (e.g. site already gone)
    console.warn("[websites/delete] remote cleanup failed:", err);
  }

  await db.website.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "website.delete",
      targetType: "website",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true });
}

// Duplicate a website
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const w = await getOwnedWebsite(id, user.id);
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let baseSlug = `${w.slug}-copy`;
  let finalSlug = baseSlug;
  let n = 1;
  while (await db.website.findFirst({ where: { userId: user.id, slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${++n}`;
  }

  const dup = await db.website.create({
    data: {
      userId: user.id,
      name: `${w.name} (copy)`,
      slug: finalSlug,
      template: w.template,
      title: w.title,
      description: w.description,
      favicon: w.favicon,
      content: w.content,
      status: "draft",
    },
  });
  await db.siteVersion.create({
    data: { websiteId: dup.id, label: "v1", content: dup.content },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "website.duplicate",
      targetType: "website",
      targetId: dup.id,
      metadata: JSON.stringify({ sourceId: id }),
    },
  });

  return NextResponse.json({ website: dup });
}
