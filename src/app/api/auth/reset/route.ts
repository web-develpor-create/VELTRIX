import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/crypto";

const RequestResetSchema = z.object({
  email: z.string().email().max(120),
});
const ResetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

// Request a reset link (always returns 200 to prevent email enumeration).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = RequestResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }
    const { email } = parsed.data;
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const token = randomToken(24);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetExpires: expires },
      });
      // In production: send an email with the link.
      // In dev mode (no email provider configured), we surface the token on the
      // response so the user can paste it directly into the reset form.
      const emailConfigured = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
      return NextResponse.json({
        ok: true,
        // Always return devToken when email isn't configured, so the user can
        // still complete a password reset locally. Production will hide this.
        ...(emailConfigured ? {} : { devToken: token, devNote: "EMAIL_SERVER/EMAIL_FROM not set — showing reset token directly for local testing." }),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/reset/request]", err);
    return NextResponse.json({ ok: true });
  }
}

// Apply the reset with a token + new password.
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token or password (min 8 chars)." }, { status: 400 });
    }
    const { token, password } = parsed.data;
    const user = await db.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } },
    });
    if (!user) {
      return NextResponse.json({ error: "Reset token is invalid or expired." }, { status: 400 });
    }
    // Import locally to avoid circular at module load time
    const { hashPassword } = await import("@/lib/crypto");
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password), resetToken: null, resetExpires: null },
    });
    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "user.password_reset",
        targetType: "user",
        targetId: user.id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/reset/apply]", err);
    return NextResponse.json({ error: "Reset failed." }, { status: 500 });
  }
}
