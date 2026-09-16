import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
  // react-icons/fa6 barrel otherwise pulls every FA6 icon into the bundle.
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default nextConfig;
