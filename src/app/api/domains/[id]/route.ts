import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Verify a custom domain by checking that the DNS TXT record matches.
// This is a real check — we run a DNS-over-HTTPS lookup via Cloudflare's
// public resolver and compare the response to our verification token.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const domain = await db.domain.findUnique({ where: { id } });
  if (!domain || domain.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (domain.kind !== "custom") {
    return NextResponse.json({ error: "Only custom domains require verification." }, { status: 400 });
  }
  if (!domain.verificationToken) {
    return NextResponse.json({ error: "No verification token." }, { status: 400 });
  }

  const lookupHost = `_veltrix-verify.${domain.hostname}`;
  let verified = false;
  let lookupError: string | undefined;
  try {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(lookupHost)}&type=TXT`,
      { headers: { accept: "application/dns-json" } }
    );
    const data: any = await r.json();
    const records: string[] = (data.Answer || [])
      .filter((a: any) => a.type === 16)
      .flatMap((a: any) => {
        // TXT answers come back as quoted strings; strip quotes
        const v = String(a.data || "").replace(/^"|"$/g, "");
        return v ? [v] : [];
      });
    verified = records.includes(domain.verificationToken);
    if (!verified) lookupError = `Found TXT records: ${records.join(", ") || "(none)"}. Expected: ${domain.verificationToken}`;
  } catch (err: any) {
    lookupError = `DNS lookup failed: ${err.message}`;
  }

  if (verified) {
    await db.domain.update({
      where: { id },
      data: { verified: true, status: "active" },
    });
    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "domain.verify",
        targetType: "domain",
        targetId: id,
        metadata: JSON.stringify({ hostname: domain.hostname }),
      },
    });
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json(
    { verified: false, error: lookupError || "Verification TXT record not found yet. DNS can take a few minutes to propagate." },
    { status: 202 }
  );
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const domain = await db.domain.findUnique({ where: { id } });
  if (!domain || domain.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.domain.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "domain.remove",
      targetType: "domain",
      targetId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
