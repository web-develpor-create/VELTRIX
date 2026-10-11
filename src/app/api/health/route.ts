import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Public-safe health check (no auth required) — used by Netlify uptime monitors
export async function GET() {
  const startedAt = Date.now();
  try {
    // Try a 1-row read to confirm DB connectivity
    await db.user.findFirst({ select: { id: true }, take: 1 });
    return NextResponse.json({
      status: "ok",
      db: "ok",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "degraded", db: "error", error: err.message, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}

// Authenticated admin system-health probe — includes provider config status
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const env = {
    HOSTING_PROVIDER: process.env.HOSTING_PROVIDER || "netlify",
    CF_ACCOUNT_ID_SET: Boolean(process.env.CF_ACCOUNT_ID),
    EMAIL_SERVER_SET: Boolean(process.env.EMAIL_SERVER),
    EMAIL_FROM_SET: Boolean(process.env.EMAIL_FROM),
    ENCRYPTION_KEY_SET: Boolean(process.env.ENCRYPTION_KEY),
    NODE_ENV: process.env.NODE_ENV || "development",
  };
  const counts = {
    users: await db.user.count(),
    websites: await db.website.count(),
    deployments: await db.deployment.count(),
    failedDeployments: await db.deployment.count({ where: { state: "error" } }),
    openSupportRequests: await db.supportRequest.count({ where: { status: "open" } }),
    connectedHostingAccounts: await db.hostingConnection.count(),
  };
  return NextResponse.json({ env, counts });
}
