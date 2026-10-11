/**
 * VELTRIX — Real hosting provider integration.
 *
 * Default provider: Netlify, via its official REST API.
 *   Docs: https://docs.netlify.com/api/get-started/
 *
 * Workflow used here:
 *   1. The user creates a Personal Access Token on their own Netlify account
 *      (User settings → Applications → Personal access tokens).
 *   2. They paste that token into Veltrix's "Connect hosting" dialog.
 *   3. Veltrix stores the token encrypted at rest (see lib/crypto).
 *   4. When the user clicks Publish, Veltrix:
 *        a. creates a Netlify site in their account (if not yet linked),
 *        b. creates a deploy via POST /api/v1/sites/:site_id/deploys
 *           with a file digest + body upload,
 *        c. retrieves the real `ssl_url` and `url` returned by Netlify,
 *        d. records the deployment in the DB and shows the user the live URL.
 *
 * The free Netlify tier issues a `<site-name>.netlify.app` subdomain
 * automatically — no extra configuration required.
 *
 * Cloudflare Pages is also supported behind the same interface. To enable it,
 * set HOSTING_PROVIDER=cloudflare_pages and provide CF_ACCOUNT_ID +
 * CF_API_TOKEN. Cloudflare Pages issues a `<project>.pages.dev` subdomain
 * on the free plan.
 *
 * IMPORTANT: We never use Veltrix's own platform credentials to publish on
 * behalf of users. Every deploy runs against the user's own connected account,
 * which respects Netlify's free-tier quotas and Terms of Service.
 */

import { decryptToken, encryptToken } from "@/lib/crypto";

export interface DeployInput {
  /** The single HTML file we are publishing. */
  html: string;
  /** Slug for the site, e.g. "my-shop" → https://my-shop.netlify.app */
  slug: string;
  /** Site title for the Netlify dashboard. */
  siteName: string;
  /** Previously linked provider site_id (if any). */
  existingSiteId?: string | null;
}

export interface DeployResult {
  provider: "netlify" | "cloudflare_pages";
  siteId: string;
  deployId: string;
  url: string;
  sslUrl: string;
  state: "ready" | "building" | "error";
  errorMessage?: string;
}

export interface ProviderClient {
  /** Create or reuse a site and return its provider site_id. */
  ensureSite(slug: string, siteName: string, existingSiteId?: string | null): Promise<{ siteId: string; url?: string }>;
  /** Upload an HTML file as a deploy and return the real URL. */
  deploy(input: DeployInput & { siteId: string }): Promise<DeployResult>;
  /** List the user's sites (for the connection health check). */
  listSites(): Promise<{ id: string; name: string; url: string }[]>;
  /** Delete the site (used by "unpublish / delete website"). */
  deleteSite(siteId: string): Promise<void>;
}

// ============================================================
//  Netlify client
// ============================================================

const NETLIFY_API = "https://api.netlify.com/api/v1";

class NetlifyClient implements ProviderClient {
  constructor(private token: string) {}

  private async req(path: string, init: RequestInit = {}) {
    const res = await fetch(`${NETLIFY_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "User-Agent": "VELTRIX/1.0",
        ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Netlify API ${res.status}: ${text.slice(0, 400)}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async listSites() {
    const data = await this.req("/sites?per_page=50");
    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      url: s.ssl_url || s.url,
    }));
  }

  async ensureSite(slug: string, siteName: string, existingSiteId?: string | null) {
    if (existingSiteId) {
      try {
        const s: any = await this.req(`/sites/${existingSiteId}`);
        return { siteId: s.id, url: s.ssl_url || s.url };
      } catch {
        // site was deleted on Netlify side — fall through and create a new one
      }
    }
    // Netlify will assign `<name>.netlify.app` based on `name` (unique).
    // We use the slug for uniqueness, prefixing with "veltrix-".
    const name = sanitizeSlug(`veltrix-${slug}`).slice(0, 36);
    const s: any = await this.req("/sites", {
      method: "POST",
      body: JSON.stringify({ name, custom_domain: null }),
    });
    return { siteId: s.id, url: s.ssl_url || s.url };
  }

  async deploy(input: DeployInput & { siteId: string }): Promise<DeployResult> {
    // Netlify deploy via digest: POST /sites/:id/deploys with file digests,
    // then PUT the file body to the SHA digest endpoint.
    const fileBody = Buffer.from(input.html, "utf8");
    const { createHash } = await import("crypto");
    const sha = "sha1:" + createHash("sha1").update(fileBody).digest("hex");

    // Step 1: create the deploy with file digest
    const deploy: any = await this.req(`/sites/${input.siteId}/deploys`, {
      method: "POST",
      body: JSON.stringify({
        files: { "/index.html": sha },
      }),
    });

    // If deploy.required includes our SHA, the file is new and we must upload it.
    const required: string[] = deploy.required || [];
    if (required.includes(sha)) {
      const uploadRes = await fetch(
        `${NETLIFY_API}/deploys/${deploy.id}/files/index.html`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/octet-stream",
          },
          body: fileBody,
        }
      );
      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Netlify file upload failed: ${uploadRes.status} ${text.slice(0, 200)}`);
      }
    }

    return {
      provider: "netlify",
      siteId: input.siteId,
      deployId: deploy.id,
      url: deploy.url ?? `https://${input.slug}.netlify.app`,
      sslUrl: deploy.ssl_url ?? deploy.url ?? `https://${input.slug}.netlify.app`,
      state: deploy.state === "ready" ? "ready" : "building",
    };
  }

  async deleteSite(siteId: string) {
    await this.req(`/sites/${siteId}`, { method: "DELETE" });
  }
}

// ============================================================
//  Cloudflare Pages client (alternative provider)
// ============================================================

class CloudflarePagesClient implements ProviderClient {
  constructor(private accountId: string, private apiToken: string) {}

  private async req(path: string, init: RequestInit = {}) {
    const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || (data && data.success === false)) {
      throw new Error(`Cloudflare API ${res.status}: ${JSON.stringify(data?.errors || data).slice(0, 400)}`);
    }
    return data;
  }

  async listSites() {
    const data = await this.req(`/accounts/${this.accountId}/pages/projects`);
    return (data.result?.projects || []).map((p: any) => ({
      id: p.name,
      name: p.name,
      url: `https://${p.subdomain}`,
    }));
  }

  async ensureSite(slug: string, siteName: string, existingSiteId?: string | null) {
    const projectName = sanitizeSlug(slug).slice(0, 56);
    if (existingSiteId) {
      try {
        const data = await this.req(`/accounts/${this.accountId}/pages/projects/${existingSiteId}`);
        return { siteId: data.result?.name, url: data.result?.subdomain };
      } catch {
        // fall through
      }
    }
    const data = await this.req(`/accounts/${this.accountId}/pages/projects`, {
      method: "POST",
      body: JSON.stringify({ name: projectName, production_branch: "main" }),
    });
    return { siteId: data.result?.name, url: data.result?.subdomain };
  }

  async deploy(input: DeployInput & { siteId: string }): Promise<DeployResult> {
    // Cloudflare Pages direct-upload deploy:
    //   1. POST /accounts/:id/pages/projects/:project/deployments (get JWT + upload URL)
    //   2. POST file content with the JWT to the upload URL
    const fileBody = Buffer.from(input.html, "utf8");
    const { createHash } = await import("crypto");
    const fileHash = createHash("sha1").update(fileBody).digest("hex");

    const init: any = await this.req(
      `/accounts/${this.accountId}/pages/projects/${input.siteId}/deployments`,
      {
        method: "POST",
        body: JSON.stringify({
          manifest: { "/index.html": { hash: fileHash, size: fileBody.length } },
        }),
      }
    );
    const jwt = init.result?.jwt;
    const uploadUrl = init.result?.upload_url;
    if (jwt && uploadUrl) {
      const form = new FormData();
      form.append("index.html", new Blob([fileBody]), "index.html");
      await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: form,
      });
    }

    const dep = init.result;
    return {
      provider: "cloudflare_pages",
      siteId: input.siteId,
      deployId: dep?.id ?? "",
      url: `https://${input.siteId}.pages.dev`,
      sslUrl: `https://${input.siteId}.pages.dev`,
      state: dep?.latest_stage?.status === "success" ? "ready" : "building",
    };
  }

  async deleteSite(siteId: string) {
    await this.req(`/accounts/${this.accountId}/pages/projects/${siteId}`, { method: "DELETE" });
  }
}

// ============================================================
//  Factory + helpers
// ============================================================

export function getProvider(): "netlify" | "cloudflare_pages" {
  const v = (process.env.HOSTING_PROVIDER || "netlify").toLowerCase();
  return v === "cloudflare_pages" ? "cloudflare_pages" : "netlify";
}

export function getProviderForUser(connection: { provider: string; accessToken: string }): ProviderClient {
  const token = decryptToken(connection.accessToken);
  if (connection.provider === "cloudflare_pages") {
    const accountId = process.env.CF_ACCOUNT_ID || "";
    if (!accountId) throw new Error("CF_ACCOUNT_ID is not set on the server.");
    return new CloudflarePagesClient(accountId, token);
  }
  return new NetlifyClient(token);
}

export { encryptToken, decryptToken };

export function sanitizeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56) || "site";
}

/**
 * Validates a Netlify personal access token format. Real validation happens
 * when we hit the API — this is just a sanity check.
 */
export function looksLikeNetlifyToken(s: string): boolean {
  return /^[\w-]{20,}$/.test(s.trim());
}
