import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Unpublish: marks the website as unpublished. The remote Netlify site is
// left intact (user owns it) but the Veltrix dashboard no longer shows it
// as live.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const website = await db.website.findUnique({ where: { id } });
  if (!website || website.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.website.update({
    where: { id },
    data: { status: "unpublished" },
  });
  await db.domain.updateMany({
    where: { websiteId: id, kind: "subdomain" },
    data: { status: "pending" },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "website.unpublish",
      targetType: "website",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
