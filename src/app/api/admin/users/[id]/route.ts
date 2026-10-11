import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const UpdateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "suspended", "banned"]).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Don't let an admin demote themselves
  if (id === admin.id && parsed.data.role === "user") {
    return NextResponse.json({ error: "You can't demote yourself." }, { status: 400 });
  }

  const target = await db.user.update({ where: { id }, data: parsed.data });
  await db.auditLog.create({
    data: {
      userId: admin.id,
      actor: admin.email,
      action: "admin.user.update",
      targetType: "user",
      targetId: id,
      metadata: JSON.stringify(parsed.data),
    },
  });
  return NextResponse.json({
    user: {
      id: target.id,
      email: target.email,
      name: target.name,
      role: target.role,
      status: target.status,
    },
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  if (id === admin.id) return NextResponse.json({ error: "You can't delete yourself." }, { status: 400 });

  await db.user.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      userId: admin.id,
      actor: admin.email,
      action: "admin.user.delete",
      targetType: "user",
      targetId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
