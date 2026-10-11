import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import {
  createSession,
  setSessionCookie,
  getClientMeta,
} from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      // Generic error to avoid user enumeration
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (user.status !== "active") {
      return NextResponse.json({ error: "Your account has been suspended. Contact support." }, { status: 403 });
    }

    const token = await createSession(user.id, getClientMeta(req));
    await setSessionCookie(token);
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "user.login",
        targetType: "user",
        targetId: user.id,
        ipAddress: getClientMeta(req).ipAddress,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
