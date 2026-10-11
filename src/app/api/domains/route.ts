import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET: list user's domains across all websites
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const domains = await db.domain.findMany({
    where: { userId: user.id },
    include: { website: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ domains });
}

// POST: add a custom domain (we generate DNS instructions + a verification
// token; user must add a CNAME/TXT record to verify ownership).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const hostname = String(body.hostname || "").trim().toLowerCase();
  const websiteId = String(body.websiteId || "");

  if (!hostname || !websiteId) {
    return NextResponse.json({ error: "Hostname and websiteId are required." }, { status: 400 });
  }
  // Basic hostname validation
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(hostname)) {
    return NextResponse.json({ error: "Invalid hostname (must be a real domain like shop.example.com)." }, { status: 400 });
  }
  // Reject provider-owned subdomains from being added as custom
  if (hostname.endsWith(".netlify.app") || hostname.endsWith(".pages.dev")) {
    return NextResponse.json({ error: "That looks like a free subdomain. Add your own domain here." }, { status: 400 });
  }

  const website = await db.website.findUnique({ where: { id: websiteId } });
  if (!website || website.userId !== user.id) {
    return NextResponse.json({ error: "Website not found." }, { status: 404 });
  }

  const existing = await db.domain.findUnique({ where: { hostname } });
  if (existing) {
    return NextResponse.json({ error: "That hostname is already registered on Veltrix." }, { status: 409 });
  }

  // Find the linked Netlify site
  const lastDeploy = await db.deployment.findFirst({
    where: { websiteId, providerSiteId: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (!lastDeploy?.providerSiteId) {
    return NextResponse.json(
      { error: "Publish this website first so we have a provider site to attach the domain to." },
      { status: 400 }
    );
  }

  const verificationToken = `veltrix-verify-${Math.random().toString(36).slice(2, 14)}`;
  const dnsRecords = {
    cname: { type: "CNAME", host: hostname, value: lastDeploy.sslUrl?.replace(/^https?:\/\//, "") || `${website.slug}.netlify.app` },
    txt: { type: "TXT", host: `_veltrix-verify.${hostname}`, value: verificationToken },
  };

  const domain = await db.domain.create({
    data: {
      websiteId,
      userId: user.id,
      kind: "custom",
      hostname,
      verified: false,
      sslProvisioned: false,
      verificationToken,
      dnsRecords: JSON.stringify(dnsRecords),
      status: "pending",
    },
  });

  // Best-effort: ask Netlify to add the custom domain to the site.
  try {
    const conn = await db.hostingConnection.findUnique({ where: { userId: user.id } });
    if (conn && conn.provider === "netlify") {
      const token = (await import("@/lib/crypto")).decryptToken(conn.accessToken);
      await fetch(`https://api.netlify.com/api/v1/sites/${lastDeploy.providerSiteId}/domains`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ hostname }),
      });
    }
  } catch (err) {
    console.warn("[domains/add] netlify domain attach failed:", err);
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      actor: user.email,
      action: "domain.add",
      targetType: "domain",
      targetId: domain.id,
      metadata: JSON.stringify({ hostname }),
    },
  });

  return NextResponse.json({ domain, dnsRecords });
}
