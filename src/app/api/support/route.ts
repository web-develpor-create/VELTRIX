import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const CreateSchema = z.object({
  subject: z.string().min(3).max(120),
  category: z.enum(["general", "billing", "deployment", "abuse", "bug"]).default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  message: z.string().min(10).max(5000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requests = await db.supportRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const req2 = await db.supportRequest.create({
    data: { userId: user.id, ...parsed.data },
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "support.create",
      targetType: "support",
      targetId: req2.id,
    },
  });
  return NextResponse.json({ request: req2 });
}
