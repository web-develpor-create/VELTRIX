import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  });
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.actor,
      targetType: l.targetType,
      targetId: l.targetId,
      metadata: l.metadata,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
      userEmail: l.user?.email,
    })),
  });
}
