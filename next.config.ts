import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable all caching for dynamic data
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
