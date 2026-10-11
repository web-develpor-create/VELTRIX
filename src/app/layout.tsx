import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VELTRIX — Build & Host Websites Free",
  description:
    "VELTRIX is a free website builder and hosting platform. Create business sites, portfolios, blogs, and stores with templates, a visual editor, and publish them with real free hosting on provider-owned subdomains.",
  keywords: [
    "VELTRIX",
    "website builder",
    "free hosting",
    "free subdomain",
    "Netlify",
    "Cloudflare Pages",
    "Next.js website",
    "no-code builder",
  ],
  authors: [{ name: "VELTRIX" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "VELTRIX — Build & Host Websites Free",
    description:
      "Create professional websites with templates and a visual editor. Publish to real free hosting with provider-owned subdomains.",
    siteName: "VELTRIX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VELTRIX — Build & Host Websites Free",
    description:
      "Create professional websites with templates and a visual editor. Publish to real free hosting with provider-owned subdomains.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
