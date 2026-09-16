import type { NextConfig } from "next";

// Browser <-> API goes same-origin through /api/* so session cookies stay
// first-party (SameSite=Lax works). Next forwards them server-side, where
// cookie policies don't apply. Set ADMIN_API_URL at build time when the API
// isn't on localhost:3001.
const API_URL =
  process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@lasertag-26/database"],
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
