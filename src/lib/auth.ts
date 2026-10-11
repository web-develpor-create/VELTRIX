import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/crypto";

export const SESSION_COOKIE = "veltrix_session";
const SESSION_TTL_DAYS = 30;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  status: string;
}

/**
 * Reads the session cookie, validates it against the DB, and returns the
 * authenticated user (or null). Safe to call from any server component /
 * route handler.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status !== "active") return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as "user" | "admin",
    status: session.user.status,
  };
}

export async function createSession(
  userId: string,
  meta: { ipAddress?: string; userAgent?: string } = {}
): Promise<string> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { token } }).catch(() => {});
}

/**
 * Route-protection helper. Returns the user or throws a 401-shaped response.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** Convenience wrapper that turns auth errors into Response objects. */
export function authErrorResponse(err: unknown): Response | null {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return new Response(JSON.stringify({ error: "You must be signed in." }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    if (err.message === "FORBIDDEN") {
      return new Response(JSON.stringify({ error: "Admin access required." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
  }
  return null;
}

export function getClientMeta(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
  const ua = req.headers.get("user-agent") || undefined;
  return { ipAddress: ip, userAgent: ua };
}
