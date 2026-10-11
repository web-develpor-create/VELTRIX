import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Admin-only overview
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, websites, deployments, failedDeployments, domains, supportOpen, auditRecent] = await Promise.all([
    db.user.count(),
    db.website.count(),
    db.deployment.count(),
    db.deployment.count({ where: { state: "error" } }),
    db.domain.count(),
    db.supportRequest.count({ where: { status: "open" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { email: true } } } }),
  ]);

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true, lastLoginAt: true },
  });
  const recentFailedDeployments = await db.deployment.findMany({
    where: { state: "error" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { website: { select: { name: true, slug: true } }, user: { select: { email: true } } },
  });

  return NextResponse.json({
    stats: {
      users,
      websites,
      deployments,
      failedDeployments,
      domains,
      supportOpen,
    },
    recentUsers,
    recentFailedDeployments,
    auditRecent: auditRecent.map((a) => ({
      id: a.id,
      action: a.action,
      actor: a.actor,
      targetType: a.targetType,
      targetId: a.targetId,
      createdAt: a.createdAt,
      userEmail: a.user?.email,
    })),
  });
}
