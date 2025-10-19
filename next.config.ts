import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable all caching for dynamic data
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  // Disable static optimization for error pages
  output: "standalone",
  // Skip static error pages generation
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
};

export default nextConfig;
