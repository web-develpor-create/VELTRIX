import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow preview subdomains to access the dev server
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn"],
};

export default nextConfig;
