import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";
import { getProviderForUser, getProvider, looksLikeNetlifyToken } from "@/lib/deploy";

// GET: connection status
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const conn = await db.hostingConnection.findUnique({ where: { userId: user.id } });
  if (!conn) return NextResponse.json({ connection: null, provider: getProvider() });
  return NextResponse.json({
    connection: {
      provider: conn.provider,
      providerEmail: conn.providerEmail,
      connectedAt: conn.connectedAt,
      updatedAt: conn.updatedAt,
      // Never expose the token to the client
      hasToken: Boolean(conn.accessToken),
    },
    provider: getProvider(),
  });
}

const ConnectSchema = z.object({
  // Netlify personal access token from the user's own Netlify account.
  token: z.string().min(20).max(300),
  provider: z.enum(["netlify", "cloudflare_pages"]).default("netlify"),
});

// POST: connect (or replace) a hosting provider token
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ConnectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token." }, { status: 400 });
    }
    const { token, provider } = parsed.data;

    if (provider === "netlify" && !looksLikeNetlifyToken(token)) {
      return NextResponse.json({ error: "That doesn't look like a Netlify token." }, { status: 400 });
    }

    // Validate the token by hitting Netlify's /user endpoint
    if (provider === "netlify") {
      const check = await fetch("https://api.netlify.com/api/v1/user", {
        headers: { Authorization: `Bearer ${token.trim()}`, "User-Agent": "VELTRIX/1.0" },
      });
      if (!check.ok) {
        return NextResponse.json(
          { error: "Netlify rejected that token. Make sure you copied the personal access token correctly." },
          { status: 400 }
        );
      }
      const u: any = await check.json();
      await db.hostingConnection.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          provider,
          accessToken: encryptToken(token.trim()),
          providerUserId: String(u.id),
          providerEmail: u.email,
        },
        update: {
          provider,
          accessToken: encryptToken(token.trim()),
          providerUserId: String(u.id),
          providerEmail: u.email,
          updatedAt: new Date(),
        },
      });
      await db.auditLog.create({
        data: {
          userId: user.id,
          actor: user.email,
          action: "hosting.connect",
          targetType: "user",
          targetId: user.id,
          metadata: JSON.stringify({ provider, providerEmail: u.email }),
        },
      });
      return NextResponse.json({
        connection: { provider, providerEmail: u.email, connectedAt: new Date() },
      });
    }

    // Cloudflare Pages path: validate by listing accounts
    if (provider === "cloudflare_pages") {
      if (!process.env.CF_ACCOUNT_ID) {
        return NextResponse.json(
          { error: "Cloudflare Pages is configured on Veltrix, but CF_ACCOUNT_ID is missing on the server." },
          { status: 500 }
        );
      }
      const check = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}`,
        { headers: { Authorization: `Bearer ${token.trim()}` } }
      );
      if (!check.ok) {
        return NextResponse.json({ error: "Cloudflare rejected that token." }, { status: 400 });
      }
      await db.hostingConnection.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          provider,
          accessToken: encryptToken(token.trim()),
        },
        update: {
          provider,
          accessToken: encryptToken(token.trim()),
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({
        connection: { provider, providerEmail: null, connectedAt: new Date() },
      });
    }

    return NextResponse.json({ error: "Unsupported provider." }, { status: 400 });
  } catch (err: any) {
    console.error("[hosting/connect]", err);
    return NextResponse.json({ error: "Could not connect provider." }, { status: 500 });
  }
}

// DELETE: disconnect
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.hostingConnection.deleteMany({ where: { userId: user.id } });
  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "hosting.disconnect",
      targetType: "user",
      targetId: user.id,
    },
  });
  return NextResponse.json({ ok: true });
}
