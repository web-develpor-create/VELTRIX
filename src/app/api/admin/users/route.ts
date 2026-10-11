import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";

  const users = await db.user.findMany({
    where: {
      AND: [
        q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {},
        status ? { status } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  return NextResponse.json({ users });
}
