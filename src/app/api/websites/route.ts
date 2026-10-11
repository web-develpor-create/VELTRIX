import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { defaultContentFor, getTemplateById } from "@/lib/templates";
import { sanitizeSlug } from "@/lib/deploy";

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  template: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const websites = await db.website.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      deployments: { orderBy: { createdAt: "desc" }, take: 1 },
      domains: { where: { kind: "subdomain" }, take: 1 },
    },
  });

  return NextResponse.json({
    websites: websites.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      template: w.template,
      title: w.title,
      description: w.description,
      status: w.status,
      updatedAt: w.updatedAt,
      publishedAt: w.publishedAt,
      latestDeployment: w.deployments[0]
        ? {
            id: w.deployments[0].id,
            state: w.deployments[0].state,
            url: w.deployments[0].url,
            sslUrl: w.deployments[0].sslUrl,
            errorMessage: w.deployments[0].errorMessage,
            createdAt: w.deployments[0].createdAt,
          }
        : null,
      subdomain: w.domains[0]?.hostname ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    const { name, template, slug } = parsed.data;

    if (!getTemplateById(template)) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }

    const baseSlug = sanitizeSlug(slug || name);
    // ensure unique slug per user
    let finalSlug = baseSlug;
    let n = 1;
    while (await db.website.findFirst({ where: { userId: user.id, slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${++n}`;
    }

    // Free-plan usage cap
    const FREE_PLAN_WEBSITE_LIMIT = Number(process.env.FREE_PLAN_WEBSITE_LIMIT || 5);
    const count = await db.website.count({ where: { userId: user.id } });
    if (count >= FREE_PLAN_WEBSITE_LIMIT) {
      return NextResponse.json(
        { error: `Free plan limit reached (${FREE_PLAN_WEBSITE_LIMIT} websites).` },
        { status: 402 }
      );
    }

    const content = defaultContentFor(template);
    const website = await db.website.create({
      data: {
        userId: user.id,
        name: name.trim(),
        slug: finalSlug,
        template,
        title: name.trim(),
        description: content.sections.find((s: any) => s.type === "hero")?.props?.subtitle || "",
        content: JSON.stringify(content),
      },
    });

    // Save the initial version
    await db.siteVersion.create({
      data: { websiteId: website.id, label: "v1", content: website.content },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        actor: user.email,
        action: "website.create",
        targetType: "website",
        targetId: website.id,
        metadata: JSON.stringify({ template, slug: finalSlug }),
      },
    });

    return NextResponse.json({ website });
  } catch (err) {
    console.error("[websites/create]", err);
    return NextResponse.json({ error: "Could not create website." }, { status: 500 });
  }
}
