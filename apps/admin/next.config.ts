import type { NextConfig } from "next";

// Browser <-> API goes same-origin through /api/* so session cookies stay
// first-party (SameSite=Lax works). Next forwards them server-side, where
// cookie policies don't apply. Rewrites are evaluated when the Next server
// starts, so a container only needs a restart (not a rebuild) to pick up a
// new target. INTERNAL_API_URL / API_INTERNAL_URL take precedence for
// single-domain deployments where Nginx routes /api/* internally
// (e.g. http://api:3001); the public URL vars remain as fallback for dev.
const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.API_INTERNAL_URL ??
  process.env.ADMIN_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@lasertag-26/database"],
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
