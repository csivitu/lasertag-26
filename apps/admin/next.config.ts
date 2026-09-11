import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lasertag-26/database"],
  devIndicators: false,
};

export default nextConfig;
