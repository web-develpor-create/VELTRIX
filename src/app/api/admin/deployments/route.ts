import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// List all deployments (with filters) for admin monitoring
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const state = url.searchParams.get("state") || "";
  const take = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  const deployments = await db.deployment.findMany({
    where: state ? { state } : {},
    orderBy: { createdAt: "desc" },
    take,
    include: {
      website: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, email: true } },
    },
  });

  return NextResponse.json({ deployments });
}
