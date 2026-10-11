import { NextResponse } from "next/server";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

export async function GET() {
  return NextResponse.json({
    templates: TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      thumbnail: t.thumbnail,
      accent: t.accent,
      // Don't leak full content in the list — fetched on demand
      preview: {
        theme: t.defaultContent.theme,
        sections: t.defaultContent.sections.length,
      },
    })),
    categories: TEMPLATE_CATEGORIES,
  });
}
