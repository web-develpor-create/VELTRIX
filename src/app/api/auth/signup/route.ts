import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, randomToken } from "@/lib/crypto";
import {
  createSession,
  setSessionCookie,
  getClientMeta,
  getCurrentUser,
} from "@/lib/auth";

const SignupSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Email must be valid and password at least 8 characters." },
        { status: 400 }
      );
    }
    const { email, password, name } = parsed.data;

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name?.trim() || null,
        passwordHash: hashPassword(password),
        emailVerifyToken: randomToken(16),
        role: (await db.user.count()) === 0 ? "admin" : "user",
      },
    });

    const token = await createSession(user.id, getClientMeta(req));
    await setSessionCookie(token);

    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "user.signup",
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
  } catch (err: any) {
    console.error("[auth/signup]", err);
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
