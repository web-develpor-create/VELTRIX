import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const PatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const updates: any = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  const updated = await db.user.update({ where: { id: user.id }, data: updates });
  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "user.profile_update",
      targetType: "user",
      targetId: user.id,
    },
  });
  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role as "user" | "admin",
      emailVerified: updated.emailVerified,
    },
  });
}
