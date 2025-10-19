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
  // Disable static page generation entirely
  staticPageGenerationTimeout: 0,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
