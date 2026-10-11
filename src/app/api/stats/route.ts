import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET: dashboard stats for the current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [websites, published, drafts, deployments, failedDeployments, domains] = await Promise.all([
    db.website.count({ where: { userId: user.id } }),
    db.website.count({ where: { userId: user.id, status: "published" } }),
    db.website.count({ where: { userId: { equals: user.id }, status: { in: ["draft", "unpublished"] } } }),
    db.deployment.count({ where: { userId: user.id } }),
    db.deployment.count({ where: { userId: user.id, state: "error" } }),
    db.domain.count({ where: { userId: user.id } }),
  ]);

  const conn = await db.hostingConnection.findUnique({ where: { userId: user.id } });
  const recentDeployments = await db.deployment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { website: { select: { name: true, slug: true } } },
  });

  // Usage for the current month
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);
  const monthlyDeploys = await db.deployment.count({
    where: { userId: user.id, createdAt: { gte: periodStart } },
  });

  const FREE_PLAN_WEBSITE_LIMIT = Number(process.env.FREE_PLAN_WEBSITE_LIMIT || 5);
  const FREE_PLAN_DEPLOY_LIMIT = Number(process.env.FREE_PLAN_DEPLOY_LIMIT || 100);

  return NextResponse.json({
    stats: {
      totalWebsites: websites,
      publishedWebsites: published,
      draftWebsites: drafts,
      totalDeployments: deployments,
      failedDeployments,
      totalDomains: domains,
      monthlyDeploys,
      limits: {
        websites: FREE_PLAN_WEBSITE_LIMIT,
        monthlyDeploys: FREE_PLAN_DEPLOY_LIMIT,
      },
      hostingConnected: Boolean(conn),
      hostingProvider: conn?.provider ?? null,
    },
    recentDeployments: recentDeployments.map((d) => ({
      id: d.id,
      state: d.state,
      url: d.url,
      sslUrl: d.sslUrl,
      errorMessage: d.errorMessage,
      trigger: d.trigger,
      createdAt: d.createdAt,
      website: d.website,
    })),
  });
}
