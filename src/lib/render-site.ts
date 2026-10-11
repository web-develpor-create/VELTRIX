import type { SiteContent, SiteSection } from "@/lib/templates";

/**
 * Renders a Veltrix website's structured content into a single self-contained
 * HTML file. This is what gets deployed to Netlify / Cloudflare Pages as the
 * user's published website.
 *
 * The output is a complete static HTML document with inline CSS — no external
 * assets, no JS bundles. This guarantees the published site loads fast and
 * works on every free hosting provider without a build step.
 */
export function renderSiteToHtml(opts: {
  title: string;
  description?: string;
  favicon?: string;
  content: SiteContent;
}): string {
  const { title, description, favicon, content } = opts;
  const theme = content.theme;
  const body = content.sections.map(renderSection).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  ${description ? `<meta name="description" content="${escapeAttr(description)}" />` : ""}
  <meta property="og:title" content="${escapeAttr(title)}" />
  ${description ? `<meta property="og:description" content="${escapeAttr(description)}" />` : ""}
  <meta property="og:type" content="website" />
  ${favicon ? `<link rel="icon" href="${escapeAttr(favicon)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{
      font-family:${theme.font};
      background:${theme.background};
      color:${theme.text};
      line-height:1.6;
      -webkit-font-smoothing:antialiased;
    }
    a{color:${theme.accent};text-decoration:none}
    a:hover{text-decoration:underline}
    .container{max-width:1120px;margin:0 auto;padding:0 24px}
    section{padding:96px 0;border-bottom:1px solid rgba(127,127,127,0.12)}
    section:last-child{border-bottom:none}
    .eyebrow{
      display:inline-block;font-size:13px;font-weight:600;letter-spacing:.08em;
      text-transform:uppercase;color:${theme.accent};margin-bottom:16px;
    }
    h1{font-size:clamp(34px,6vw,60px);line-height:1.05;font-weight:800;letter-spacing:-0.02em}
    h2{font-size:clamp(26px,4vw,38px);line-height:1.15;font-weight:700;letter-spacing:-0.01em;margin-bottom:12px}
    h3{font-size:18px;font-weight:600}
    .lead{font-size:18px;opacity:.78;max-width:60ch;margin-top:16px}
    .btn{
      display:inline-block;background:${theme.accent};color:#fff;
      padding:14px 26px;border-radius:10px;font-weight:600;
      text-decoration:none;transition:transform .15s ease;
      border:none;cursor:pointer;font-size:15px;
    }
    .btn:hover{transform:translateY(-2px);text-decoration:none}
    .grid{display:grid;gap:32px}
    .grid-3{grid-template-columns:repeat(3,1fr)}
    .grid-4{grid-template-columns:repeat(4,1fr)}
    .grid-2{grid-template-columns:repeat(2,1fr)}
    @media (max-width:820px){.grid-3,.grid-4{grid-template-columns:1fr}.grid-2{grid-template-columns:1fr}}
    .card{background:rgba(127,127,127,0.06);border:1px solid rgba(127,127,127,0.14);padding:28px;border-radius:14px}
    .icon{font-size:30px;margin-bottom:14px}
    .stat-value{font-size:42px;font-weight:800;color:${theme.accent};letter-spacing:-0.02em}
    .stat-label{font-size:14px;opacity:.7;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
    .menu-section{margin-bottom:32px}
    .menu-section h3{font-size:22px;color:${theme.accent};margin-bottom:12px;border-bottom:1px solid rgba(127,127,127,0.18);padding-bottom:8px}
    .menu-item{display:flex;justify-content:space-between;gap:16px;margin-bottom:12px}
    .menu-item .name{font-weight:600}
    .menu-item .desc{opacity:.7;font-size:14px}
    .menu-item .price{color:${theme.accent};font-weight:700;white-space:nowrap}
    .gallery-tile{aspect-ratio:4/3;border-radius:14px;display:flex;align-items:flex-end;padding:20px;color:#fff;font-weight:600}
    .post{padding:20px 0;border-bottom:1px solid rgba(127,127,127,0.14)}
    .post .date{font-size:13px;color:${theme.accent};text-transform:uppercase;letter-spacing:.06em}
    .product-tile{background:rgba(127,127,127,0.06);border:1px solid rgba(127,127,127,0.14);border-radius:14px;overflow:hidden}
    .product-swatch{aspect-ratio:4/3;background:var(--swatch)}
    .product-body{padding:18px}
    footer.site-footer{padding:40px 0;text-align:center;font-size:14px;opacity:.65}
    .center{text-align:center}
    .maxw-prose{max-width:65ch}
  </style>
</head>
<body>
${body}
<footer class="site-footer">
  <div class="container">© ${new Date().getFullYear()} ${escapeHtml(title)}. Built with <a href="https://veltrix.app" rel="noopener">VELTRIX</a>.</div>
</footer>
</body>
</html>`;
}

function renderSection(section: SiteSection): string {
  switch (section.type) {
    case "hero":
      return `<section id="hero"><div class="container" style="text-align:center;padding:120px 0">
  ${section.props.eyebrow ? `<span class="eyebrow">${escapeHtml(section.props.eyebrow)}</span>` : ""}
  <h1>${escapeHtml(section.props.title || "")}</h1>
  ${section.props.subtitle ? `<p class="lead" style="margin-left:auto;margin-right:auto">${escapeHtml(section.props.subtitle)}</p>` : ""}
  ${section.props.ctaText ? `<p style="margin-top:32px"><a class="btn" href="${escapeAttr(section.props.ctaHref || "#")}">${escapeHtml(section.props.ctaText)}</a></p>` : ""}
</div></section>`;

    case "features": {
      const items = (section.props.items || [])
        .map(
          (it: any) => `<div class="card">
  <div class="icon">${escapeHtml(it.icon || "✦")}</div>
  <h3>${escapeHtml(it.title || "")}</h3>
  <p style="opacity:.78;margin-top:8px">${escapeHtml(it.text || "")}</p>
</div>`
        )
        .join("");
      return `<section id="features"><div class="container">
  ${section.props.title ? `<h2 class="center">${escapeHtml(section.props.title)}</h2>` : ""}
  ${section.props.subtitle ? `<p class="lead center" style="margin:0 auto 40px">${escapeHtml(section.props.subtitle)}</p>` : ""}
  <div class="grid grid-${section.props.items?.length >= 4 ? "4" : "3"}">${items}</div>
</div></section>`;
    }

    case "stats": {
      const items = (section.props.items || [])
        .map(
          (it: any) => `<div class="center"><div class="stat-value">${escapeHtml(it.value)}</div><div class="stat-label">${escapeHtml(it.label)}</div></div>`
        )
        .join("");
      return `<section id="stats"><div class="container">
  ${section.props.title ? `<h2 class="center" style="margin-bottom:40px">${escapeHtml(section.props.title)}</h2>` : ""}
  <div class="grid grid-${section.props.items?.length || 3}">${items}</div>
</div></section>`;
    }

    case "gallery": {
      const items = (section.props.items || [])
        .map(
          (it: any) => `<div class="gallery-tile" style="background:linear-gradient(135deg, ${it.color || "#6366f1"}, ${shade(it.color || "#6366f1", -30)})">
  <div><div style="font-size:13px;opacity:.85">${escapeHtml(it.subtitle || "")}</div><div style="font-size:20px">${escapeHtml(it.title || "")}</div></div>
</div>`
        )
        .join("");
      return `<section id="gallery"><div class="container">
  ${section.props.title ? `<h2 style="margin-bottom:32px">${escapeHtml(section.props.title)}</h2>` : ""}
  <div class="grid grid-2">${items}</div>
</div></section>`;
    }

    case "text":
      return `<section id="text"><div class="container maxw-prose" style="margin:0 auto">
  ${section.props.title ? `<h2>${escapeHtml(section.props.title)}</h2>` : ""}
  <p style="opacity:.82;font-size:17px">${escapeHtml(section.props.body || "")}</p>
</div></section>`;

    case "cta":
      return `<section id="cta"><div class="container center" style="padding:80px 0">
  <h2>${escapeHtml(section.props.title || "")}</h2>
  ${section.props.ctaText ? `<p style="margin-top:24px"><a class="btn" href="${escapeAttr(section.props.ctaHref || "#")}">${escapeHtml(section.props.ctaText)}</a></p>` : ""}
</div></section>`;

    case "contact":
      return `<section id="contact"><div class="container">
  <h2>${escapeHtml(section.props.title || "Contact")}</h2>
  <div style="margin-top:24px;display:flex;flex-direction:column;gap:6px;font-size:17px">
    ${section.props.email ? `<div>✉️ <a href="mailto:${escapeAttr(section.props.email)}">${escapeHtml(section.props.email)}</a></div>` : ""}
    ${section.props.phone ? `<div>📞 ${escapeHtml(section.props.phone)}</div>` : ""}
  </div>
</div></section>`;

    case "menu": {
      const sections = (section.props.sections || [])
        .map(
          (sec: any) => `<div class="menu-section">
  <h3>${escapeHtml(sec.name || "")}</h3>
  ${(sec.items || [])
    .map(
      (it: any) => `<div class="menu-item">
    <div><div class="name">${escapeHtml(it.name || "")}</div>${it.desc ? `<div class="desc">${escapeHtml(it.desc)}</div>` : ""}</div>
    <div class="price">${escapeHtml(it.price || "")}</div>
  </div>`
    )
    .join("")}
</div>`
        )
        .join("");
      return `<section id="menu"><div class="container">
  ${section.props.title ? `<h2 style="margin-bottom:24px">${escapeHtml(section.props.title)}</h2>` : ""}
  ${sections}
</div></section>`;
    }

    case "posts": {
      const items = (section.props.items || [])
        .map(
          (it: any) => `<div class="post">
  <div class="date">${escapeHtml(it.date || "")}</div>
  <h3 style="margin-top:6px">${escapeHtml(it.title || "")}</h3>
  ${it.excerpt ? `<p style="opacity:.78;margin-top:6px">${escapeHtml(it.excerpt)}</p>` : ""}
</div>`
        )
        .join("");
      return `<section id="posts"><div class="container">
  ${section.props.title ? `<h2 style="margin-bottom:24px">${escapeHtml(section.props.title)}</h2>` : ""}
  ${items}
</div></section>`;
    }

    case "products": {
      const items = (section.props.items || [])
        .map(
          (it: any) => `<div class="product-tile">
  <div class="product-swatch" style="--swatch:${it.color || "#ccc"}"></div>
  <div class="product-body">
    <h3>${escapeHtml(it.name || "")}</h3>
    <div style="color:${section.props.accent || "inherit"};font-weight:700;margin-top:4px">${escapeHtml(it.price || "")}</div>
  </div>
</div>`
        )
        .join("");
      return `<section id="products"><div class="container">
  ${section.props.title ? `<h2 style="margin-bottom:32px">${escapeHtml(section.props.title)}</h2>` : ""}
  <div class="grid grid-4">${items}</div>
</div></section>`;
    }

    default:
      return "";
  }
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

/** Lighten or darken a hex color by percent (-100..100). */
function shade(hex: string, percent: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const num = parseInt(m, 16);
  let r = (num >> 16) + Math.round(2.55 * percent);
  let g = ((num >> 8) & 0xff) + Math.round(2.55 * percent);
  let b = (num & 0xff) + Math.round(2.55 * percent);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}
