import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser, destroySession, clearSessionCookie, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getCurrentUser();
  if (token) await destroySession(token);
  await clearSessionCookie();

  if (user) {
    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "user.logout",
        targetType: "user",
        targetId: user.id,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
