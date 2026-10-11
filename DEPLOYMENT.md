# VELTRIX — Deployment Guide

This document explains how to deploy VELTRIX to Netlify (the main platform) and how your users publish their own websites to Netlify (their own accounts).

> **Two separate things:**
> 1. **Veltrix itself** runs on Netlify — this is the platform users log into.
> 2. **User websites** are deployed into each user's own Netlify account via the Netlify API — Veltrix never uses platform credentials for user sites.

---

## A. Deploy Veltrix to Netlify

### 1. Create a database

Veltrix needs a PostgreSQL database in production. Free options:

- **[Neon](https://neon.tech)** — 0.5 GB free, serverless, branching
- **[Supabase](https://supabase.com)** — 500 MB free
- **[Railway](https://railway.app)** — $5 free credit/month

Create a project and copy the connection string. It looks like:

```
postgresql://user:password@ep-xxx.region.aws.neon.tech/veltrix?sslmode=require
```

### 2. Switch the Prisma provider to PostgreSQL

Edit `prisma/schema.prisma` line 14:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

Then run locally to generate the SQL migration:

```bash
bun run db:generate
bun run db:push    # creates tables in your Postgres
```

### 3. Push to GitHub

```bash
git init
git add .
git commit -m "VELTRIX initial commit"
git remote add origin https://github.com/YOUR_USERNAME/veltrix.git
git push -u origin main
```

> ⚠️ Make sure `.env` is in `.gitignore` (it is, by default). Real secrets should never be committed.

### 4. Connect Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Pick your GitHub repo.
3. Build settings (auto-detected from `netlify.toml`):
   - Build command: `bun run db:generate && bun run build`
   - Publish directory: `.next/standalone`
4. Click **Deploy site**.

### 5. Set environment variables

In Netlify dashboard → **Site settings** → **Environment variables**, add:

| Key | Value | Required? |
|---|---|---|
| `DATABASE_URL` | your Postgres connection string | ✅ yes |
| `ENCRYPTION_KEY` | `openssl rand -base64 48` (generate one) | ✅ yes |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` (generate one) | ✅ yes |
| `HOSTING_PROVIDER` | `netlify` (default) | optional |
| `FREE_PLAN_WEBSITE_LIMIT` | `5` | optional |
| `FREE_PLAN_DEPLOY_LIMIT` | `100` | optional |
| `EMAIL_SERVER` | `smtps://user:pass@smtp.mailgun.org:465` | optional (enables real reset emails) |
| `EMAIL_FROM` | `VELTRIX <noreply@yourdomain.com>` | optional |

### 6. Trigger a deploy

Push any commit, or hit **Trigger deploy** in Netlify. The first deploy creates your database tables and starts the app.

### 7. Create the admin user

The **first user who signs up** becomes the admin automatically. After that, additional users are normal users.

You can also promote a user to admin manually:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'you@example.com';
```

---

## B. How users publish websites

This is the real, no-bullshit flow:

1. User signs up at your Veltrix deployment.
2. User opens the dashboard → **New website** → picks a template.
3. User edits content in the visual editor → **Save draft**.
4. User goes to **Settings → Hosting** and connects their own Netlify account:
   - They create a free Netlify account at [app.netlify.com/signup](https://app.netlify.com/signup).
   - They generate a Personal Access Token at [User settings → Applications](https://app.netlify.com/user/applications#personal-access-tokens).
   - They paste the token into Veltrix.
   - Veltrix validates the token via `GET /api/v1/user`, then encrypts it with AES-256-GCM and stores it.
5. User clicks **Publish** on a website.
6. Veltrix renders the website to a single self-contained HTML file.
7. Veltrix calls Netlify's API:
   - `POST /api/v1/sites` → creates a site in the user's account (if not already linked)
   - `POST /api/v1/sites/:id/deploys` → creates a deploy with file digest
   - `PUT /api/v1/deploys/:id/files/index.html` → uploads the HTML
8. Netlify returns the real `ssl_url` (e.g. `https://veltrix-my-shop--main.netlify.app`).
9. Veltrix saves the URL in the database and shows it in the dashboard.
10. The user can update, redeploy, unpublish, or delete the website.

---

## C. Free plan — what's actually free

### On Veltrix's side (no charge)
- Unlimited users
- 5 websites per user (configurable via `FREE_PLAN_WEBSITE_LIMIT`)
- 100 deploys per user per month (configurable via `FREE_PLAN_DEPLOY_LIMIT`)
- Visual editor + 7 templates
- Version history
- Admin panel

### On Netlify's side (per user account, free tier as of 2026)
- 100 GB bandwidth / month
- 300 build minutes / month
- 500 deploys / month per site
- Unlimited personal sites
- HTTPS via Let's Encrypt
- `*.netlify.app` subdomain

### Not free (and never claimed to be)
- Custom domain registration (~$10-15/year for a .com from any registrar)
- Higher Netlify quotas (upgrade directly with Netlify, not Veltrix)
- Email sending (you need an SMTP provider for password reset emails — Mailgun/Resend/SendGrid all have free tiers)

---

## D. Troubleshooting

### Build fails with "Prisma can't reach database"
- Double-check `DATABASE_URL` is set in Netlify env vars (not just locally).
- For Neon/Supabase, ensure `?sslmode=require` is in the connection string.

### "Error: ENCRYPTION_KEY is not set"
- Generate one with `openssl rand -base64 48` and set it as an env var.
- Without it, Veltrix falls back to `NEXTAUTH_SECRET`. Set at least one.

### Publish fails with "Netlify rejected that token"
- The user's personal access token is invalid or expired.
- They should regenerate it at [User settings → Applications](https://app.netlify.com/user/applications#personal-access-tokens) and reconnect.

### Publish fails with "402 Free plan limit reached"
- User hit their monthly deploy cap. Either:
  - Wait until next month, or
  - Raise `FREE_PLAN_DEPLOY_LIMIT` for that user via the admin panel or SQL.

### Custom domain verification never succeeds
- DNS propagation can take 5-30 minutes.
- Veltrix uses Cloudflare's public DNS-over-HTTPS resolver to check TXT records.
- Verify the user actually added the records at their registrar (not just claimed they did).

### "Cannot find module @prisma/client"
- The build command runs `bun run db:generate` first — ensure this is in `netlify.toml`.
- If using a CI cache, exclude `node_modules/.prisma`.

---

## E. Local development

```bash
# Install deps
bun install

# Create the local SQLite db
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'ENCRYPTION_KEY="veltrix-dev-only-key-please-set-ENCRYPTION_KEY"' >> .env
bun run db:push

# Run the dev server (auto-started by the sandbox)
# Visit http://localhost:3000
```

---

## F. What's NOT included in this version (be honest)

- ❌ No OAuth login (GitHub/Google) — only email/password. Can be added via NextAuth if needed.
- ❌ No real-time collaboration in the editor.
- ❌ No custom HTML/JS server-side code on user sites — only structured sections.
- ❌ No image uploads — users link to external image URLs.
- ❌ No email verification flow by default — requires `EMAIL_SERVER` config.
- ❌ No automated tests yet — manual browser testing has been done.

These are deliberate scope limits, not bugs. Each can be added incrementally.
