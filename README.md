# VELTRIX

A complete, production-ready website builder + free hosting platform. Build websites with templates and a visual editor, publish them with real free hosting on Netlify.

## Quick start (local dev)

```bash
# 1. Install dependencies
bun install

# 2. Set up the database (SQLite for local dev)
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'ENCRYPTION_KEY="veltrix-dev-only-key-please-set-ENCRYPTION_KEY"' >> .env

# 3. Push the database schema
bun run db:push

# 4. Create an admin account (optional)
bun run scripts/create-admin.ts

# 5. Start the dev server
bun run dev
# Visit http://localhost:3000
```

## Default admin account

After running `bun run scripts/create-admin.ts`:

- **Email**: `chuzidp@gmail.com`
- **Password**: `Admin098@`

You can change these by editing `scripts/create-admin.ts`.

## Production deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step Netlify + Postgres setup.

The TL;DR:

1. Push to GitHub.
2. Import into Netlify.
3. Set env vars: `DATABASE_URL`, `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`.
4. Edit `prisma/schema.prisma` line 14: change `provider = "sqlite"` to `provider = "postgresql"`.
5. Deploy.

## How publishing works

Each user connects their own Netlify account (Settings → Hosting) with a Personal Access Token. When they click **Publish**:

1. Veltrix renders the website to a self-contained HTML file.
2. Veltrix calls Netlify's official API to create a deploy in **the user's** account.
3. Netlify returns the real `ssl_url` (e.g. `https://veltrix-my-shop.netlify.app`).
4. Veltrix saves the URL and displays it in the dashboard.

Veltrix never uses platform credentials for user sites — every deploy runs against the user's own Netlify account.

## Tech stack

- Next.js 16 (App Router) + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM (SQLite local / Postgres prod)
- Zustand for client state
- Native Node.js crypto (scrypt + AES-256-GCM) for password hashing and token encryption

## Project structure

```
src/
  app/
    api/                     # All API routes (auth, websites, publish, domains, admin, etc.)
    page.tsx                 # SPA shell — switches between landing/dashboard/editor/admin
    layout.tsx               # Root layout with Veltrix metadata
    globals.css              # Veltrix brand theme (dark, blue→purple gradient)
  components/
    ui/                      # shadcn/ui components
    veltrix/
      landing/               # Hero, Features, TemplatesPreview, Pricing, FAQ, CTA
      auth/                  # AuthModal (signup/login/reset)
      dashboard/             # Dashboard, Settings, Domains, Docs, Pricing, Support views
      editor/                # TemplatesGallery, WebsiteEditor
      admin/                 # AdminPanel with overview/users/deployments/audit/system tabs
      shared/                # Navbar, Footer, VeltrixLogo
  lib/
    auth.ts                  # Sessions, getCurrentUser, requireUser, requireAdmin
    crypto.ts                # scrypt password hashing, AES-256-GCM token encryption
    db.ts                    # Prisma client
    deploy.ts                # Netlify + Cloudflare Pages API clients
    render-site.ts           # Renders structured content → deployable HTML
    templates.ts             # 7 built-in templates
  store/
    app-store.ts             # Zustand store for SPA navigation
prisma/
  schema.prisma              # 10 models — User, Session, Website, Deployment, Domain, etc.
public/
  veltrix-logo.svg           # Veltrix logo (blue→purple gradient)
  veltrix-logo.png           # Original logo PNG
  favicon.svg                # V mark favicon
netlify.toml                 # Netlify build config + security headers
DEPLOYMENT.md                # Full deployment guide
```

## Honest limitations

- 5 websites per user, 100 deploys/month (configurable via env vars)
- Subject to Netlify's free-tier quotas
- No free `.com` registration (no registrar offers it)
- Email verification requires SMTP config (otherwise dev mode shows reset token)
- No OAuth login (GitHub/Google) — only email/password
- No image uploads — users link to external image URLs

See `DEPLOYMENT.md` for the full honest list.

## License

MIT — use it, fork it, ship it.
