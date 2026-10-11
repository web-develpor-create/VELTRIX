import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// List saved versions
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const w = await db.website.findUnique({ where: { id } });
  if (!w || w.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const versions = await db.siteVersion.findMany({
    where: { websiteId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({
    versions: versions.map((v) => ({ ...v, content: JSON.parse(v.content) })),
  });
}

// Save a new version
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const w = await db.website.findUnique({ where: { id } });
  if (!w || w.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const label = String(body.label || `v-${Date.now()}`).slice(0, 60);
  const content = body.content ?? JSON.parse(w.content);

  const version = await db.siteVersion.create({
    data: { websiteId: id, label, content: JSON.stringify(content) },
  });
  return NextResponse.json({ version: { ...version, content: JSON.parse(version.content) } });
}
