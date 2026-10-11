// VELTRIX website templates.
// Each template defines a structured `content` payload that the visual editor
// and the static-site generator (lib/render-site.ts) both understand.

export interface SiteSection {
  id: string;
  type: "hero" | "features" | "gallery" | "text" | "cta" | "contact" | "menu" | "products" | "posts" | "stats" | "footer";
  props: Record<string, any>;
}

export interface SiteContent {
  theme: {
    primary: string;
    accent: string;
    background: string;
    text: string;
    font: string;
  };
  sections: SiteSection[];
}

export interface TemplateDef {
  id: string;
  name: string;
  category: "business" | "portfolio" | "agency" | "blog" | "restaurant" | "landing" | "store";
  description: string;
  thumbnail: string; // emoji or gradient class
  accent: string;
  defaultContent: SiteContent;
}

const FONTS = "'Inter', 'Geist', system-ui, sans-serif";

export const TEMPLATES: TemplateDef[] = [
  {
    id: "business-pro",
    name: "Business Pro",
    category: "business",
    description: "Clean corporate site with hero, services, stats, and contact.",
    thumbnail: "💼",
    accent: "#3b82f6",
    defaultContent: {
      theme: { primary: "#1e3a8a", accent: "#3b82f6", background: "#ffffff", text: "#0f172a", font: FONTS },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            eyebrow: "Welcome to Acme Co.",
            title: "Building tomorrow's enterprises, today.",
            subtitle: "We help teams ship faster with proven strategy, modern tooling, and relentless focus on outcomes.",
            ctaText: "Get a quote",
            ctaHref: "#contact",
          },
        },
        {
          id: "features-1",
          type: "features",
          props: {
            title: "What we do",
            subtitle: "End-to-end services for ambitious teams.",
            items: [
              { icon: "📈", title: "Strategy", text: "Market research, positioning, and roadmaps that align teams." },
              { icon: "⚙️", title: "Operations", text: "Process design and tooling that scales without friction." },
              { icon: "🎯", title: "Growth", text: "Data-driven experiments across the full funnel." },
            ],
          },
        },
        {
          id: "stats-1",
          type: "stats",
          props: {
            title: "Trusted by 200+ companies",
            items: [
              { value: "200+", label: "Clients" },
              { value: "98%", label: "Retention" },
              { value: "$1.2B", label: "Revenue influenced" },
            ],
          },
        },
        {
          id: "cta-1",
          type: "cta",
          props: { title: "Ready to grow?", ctaText: "Book a call", ctaHref: "#contact" },
        },
        {
          id: "contact-1",
          type: "contact",
          props: { title: "Contact us", email: "hello@acme.example", phone: "+1 (555) 010-2030" },
        },
      ],
    },
  },
  {
    id: "portfolio-lite",
    name: "Portfolio Lite",
    category: "portfolio",
    description: "Minimal portfolio with hero, projects gallery, and about.",
    thumbnail: "🎨",
    accent: "#a855f7",
    defaultContent: {
      theme: { primary: "#7e22ce", accent: "#a855f7", background: "#0f0a1a", text: "#f5f3ff", font: FONTS },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            eyebrow: "Designer & Developer",
            title: "Hi, I'm Alex — I craft digital experiences.",
            subtitle: "Independent designer working with brands and startups to ship beautiful, functional products.",
            ctaText: "See my work",
            ctaHref: "#gallery",
          },
        },
        {
          id: "gallery-1",
          type: "gallery",
          props: {
            title: "Selected work",
            items: [
              { title: "Lumen App", subtitle: "Product design", color: "#6366f1" },
              { title: "Brand X", subtitle: "Identity", color: "#a855f7" },
              { title: "Northwind", subtitle: "Web design", color: "#3b82f6" },
              { title: "Coral", subtitle: "Mobile app", color: "#ec4899" },
            ],
          },
        },
        {
          id: "text-1",
          type: "text",
          props: {
            title: "About",
            body: "I'm a multidisciplinary designer based in Lisbon. Over the past 8 years I've shipped products for fintech, healthcare, and entertainment companies.",
          },
        },
        {
          id: "contact-1",
          type: "contact",
          props: { title: "Let's talk", email: "hi@alex.design", phone: "" },
        },
      ],
    },
  },
  {
    id: "agency-studio",
    name: "Agency Studio",
    category: "agency",
    description: "Bold agency site with services, case studies, and team.",
    thumbnail: "🚀",
    accent: "#6366f1",
    defaultContent: {
      theme: { primary: "#4338ca", accent: "#6366f1", background: "#0a0a0f", text: "#f8fafc", font: FONTS },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            eyebrow: "Creative Studio",
            title: "We build brands the internet remembers.",
            subtitle: "A small team of designers, engineers, and strategists. Big-impact work for ambitious clients.",
            ctaText: "Start a project",
            ctaHref: "#contact",
          },
        },
        {
          id: "features-1",
          type: "features",
          props: {
            title: "Capabilities",
            items: [
              { icon: "🎨", title: "Brand", text: "Identity systems, voice, and visual language." },
              { icon: "🧩", title: "Product", text: "Research, UX, UI, and prototyping." },
              { icon: "🛠️", title: "Engineering", text: "Web, mobile, and design systems." },
              { icon: "📣", title: "Launch", text: "Go-to-market, content, and growth." },
            ],
          },
        },
        {
          id: "stats-1",
          type: "stats",
          props: {
            title: "Outcomes that matter",
            items: [
              { value: "12", label: "Years" },
              { value: "150+", label: "Projects" },
              { value: "9", label: "Awards" },
            ],
          },
        },
        {
          id: "cta-1",
          type: "cta",
          props: { title: "Have a project in mind?", ctaText: "Tell us about it", ctaHref: "#contact" },
        },
        {
          id: "contact-1",
          type: "contact",
          props: { title: "Contact", email: "studio@agency.example", phone: "" },
        },
      ],
    },
  },
  {
    id: "blog-clean",
    name: "Blog Clean",
    category: "blog",
    description: "Reading-first blog with hero, post list, and newsletter CTA.",
    thumbnail: "📝",
    accent: "#0ea5e9",
    defaultContent: {
      theme: { primary: "#0c4a6e", accent: "#0ea5e9", background: "#fafaf9", text: "#1c1917", font: FONTS },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            eyebrow: "Notes on craft",
            title: "The Margin — a blog about building things.",
            subtitle: "Essays on design, code, and the business of software.",
            ctaText: "Read latest",
            ctaHref: "#posts",
          },
        },
        {
          id: "posts-1",
          type: "posts",
          props: {
            title: "Latest posts",
            items: [
              { title: "On saying no", date: "2026-09-12", excerpt: "A short essay on the discipline of focus." },
              { title: "Designing for trust", date: "2026-08-30", excerpt: "Patterns that build confidence over time." },
              { title: "Small teams, big leverage", date: "2026-08-04", excerpt: "Why we keep our team tiny on purpose." },
            ],
          },
        },
        {
          id: "cta-1",
          type: "cta",
          props: { title: "One email a week. No spam.", ctaText: "Subscribe", ctaHref: "#contact" },
        },
      ],
    },
  },
  {
    id: "restaurant-menu",
    name: "Restaurant Menu",
    category: "restaurant",
    description: "Warm restaurant site with menu, hours, and reservation CTA.",
    thumbnail: "🍽️",
    accent: "#f97316",
    defaultContent: {
      theme: { primary: "#7c2d12", accent: "#f97316", background: "#1c1410", text: "#fef3c7", font: FONTS },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            eyebrow: "Open Tue–Sun · 5pm–11pm",
            title: "Trattoria Sole — wood-fired Italian.",
            subtitle: "Hand-made pasta, seasonal ingredients, natural wine.",
            ctaText: "Reserve a table",
            ctaHref: "#contact",
          },
        },
        {
          id: "menu-1",
          type: "menu",
          props: {
            title: "Menu",
            sections: [
              {
                name: "Antipasti",
                items: [
                  { name: "Burrata di Puglia", price: "$14", desc: "Tomato, basil, olive oil." },
                  { name: "Vitello Tonnato", price: "$16", desc: "Cold veal, tuna-caper sauce." },
                ],
              },
              {
                name: "Pasta",
                items: [
                  { name: "Tagliatelle al Ragù", price: "$22", desc: "Slow-cooked beef ragù." },
                  { name: "Spaghetti alle Vongole", price: "$24", desc: "Clams, white wine, chili." },
                ],
              },
            ],
          },
        },
        {
          id: "contact-1",
          type: "contact",
          props: { title: "Find us", email: "ciao@trattoliasole.example", phone: "+1 (555) 242-8282" },
        },
      ],
    },
  },
  {
    id: "landing-launch",
    name: "Landing Launch",
    category: "landing",
    description: "High-conversion product launch landing page.",
    thumbnail: "⚡",
    accent: "#10b981",
    defaultContent: {
      theme: { primary: "#065f46", accent: "#10b981", background: "#02110b", text: "#ecfdf5", font: FONTS },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            eyebrow: "Now in beta",
            title: "Ship your SaaS in a weekend, not a quarter.",
            subtitle: "Launchpad gives you auth, billing, dashboards, and analytics out of the box. Focus on what's unique.",
            ctaText: "Start free",
            ctaHref: "#contact",
          },
        },
        {
          id: "features-1",
          type: "features",
          props: {
            title: "Everything you need",
            items: [
              { icon: "🔐", title: "Auth", text: "Email, OAuth, MFA, teams, and roles." },
              { icon: "💳", title: "Billing", text: "Stripe-powered subscriptions and usage." },
              { icon: "📊", title: "Dashboards", text: "Pre-built admin and user dashboards." },
              { icon: "📨", title: "Email", text: "Transactional email and templates." },
            ],
          },
        },
        {
          id: "stats-1",
          type: "stats",
          props: {
            title: "Loved by founders",
            items: [
              { value: "2,400+", label: "Projects launched" },
              { value: "< 5 min", label: "Time to first deploy" },
              { value: "99.99%", label: "API uptime" },
            ],
          },
        },
        {
          id: "cta-1",
          type: "cta",
          props: { title: "Ready to ship?", ctaText: "Get started", ctaHref: "#contact" },
        },
      ],
    },
  },
  {
    id: "store-shop",
    name: "Store Shop",
    category: "store",
    description: "Online store front-end with products and contact.",
    thumbnail: "🛍️",
    accent: "#ec4899",
    defaultContent: {
      theme: { primary: "#9d174d", accent: "#ec4899", background: "#fff1f5", text: "#1f2937", font: FONTS },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            eyebrow: "Handmade goods",
            title: "Coral & Co. — small-batch goods for everyday life.",
            subtitle: "Ceramics, textiles, and accessories made in our Portland studio.",
            ctaText: "Shop the collection",
            ctaHref: "#products",
          },
        },
        {
          id: "products-1",
          type: "products",
          props: {
            title: "Featured products",
            items: [
              { name: "Mug — Sand", price: "$28", color: "#d4a574" },
              { name: "Throw — Linen", price: "$84", color: "#e8b4bc" },
              { name: "Vase — Clay", price: "$52", color: "#c98a5a" },
              { name: "Tote — Natural", price: "$36", color: "#e5d5b8" },
            ],
          },
        },
        {
          id: "cta-1",
          type: "cta",
          props: { title: "Free shipping over $75.", ctaText: "Browse all", ctaHref: "#products" },
        },
        {
          id: "contact-1",
          type: "contact",
          props: { title: "Questions?", email: "hi@coralandco.example", phone: "" },
        },
      ],
    },
  },
];

export function getTemplateById(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function defaultContentFor(templateId: string): SiteContent {
  const tpl = getTemplateById(templateId) ?? TEMPLATES[0];
  // Deep clone so users can edit freely
  return JSON.parse(JSON.stringify(tpl.defaultContent)) as SiteContent;
}

export const TEMPLATE_CATEGORIES: { id: string; label: string; description: string }[] = [
  { id: "all", label: "All", description: "Browse every template" },
  { id: "business", label: "Business", description: "Corporate and professional services" },
  { id: "portfolio", label: "Portfolio", description: "Personal and creative portfolios" },
  { id: "agency", label: "Agency", description: "Studios and creative agencies" },
  { id: "blog", label: "Blog", description: "Reading-first publications" },
  { id: "restaurant", label: "Restaurant", description: "Menus, hours, reservations" },
  { id: "landing", label: "Landing", description: "Product launch pages" },
  { id: "store", label: "Store", description: "Online store fronts" },
];
