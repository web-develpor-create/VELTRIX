"use client";

import { VeltrixMark } from "./VeltrixLogo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <VeltrixMark size={32} />
              <span className="text-lg font-bold veltrix-text-gradient">VELTRIX</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Build & host websites free. Real free hosting on provider-owned subdomains.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#templates" className="hover:text-foreground">Templates</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="https://docs.netlify.com/api/get-started/" target="_blank" rel="noopener" className="hover:text-foreground">Netlify API</a></li>
              <li><a href="https://developers.cloudflare.com/pages/" target="_blank" rel="noopener" className="hover:text-foreground">Cloudflare Pages</a></li>
              <li><a href="https://www.prisma.io/docs" target="_blank" rel="noopener" className="hover:text-foreground">Prisma Docs</a></li>
              <li><a href="https://nextjs.org/docs" target="_blank" rel="noopener" className="hover:text-foreground">Next.js Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Honest limits</h4>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>5 websites per account (free)</li>
              <li>100 deploys / month (free)</li>
              <li>Provider-owned subdomain only</li>
              <li>Custom domains require your own domain</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} VELTRIX. Built with Next.js, Prisma, and Tailwind CSS.</p>
          <p>
            Free hosting via{" "}
            <a href="https://www.netlify.com/" target="_blank" rel="noopener" className="underline hover:text-foreground">Netlify</a>{" "}
            &{" "}
            <a href="https://pages.cloudflare.com/" target="_blank" rel="noopener" className="underline hover:text-foreground">Cloudflare Pages</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
