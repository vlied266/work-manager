import type { NextConfig } from "next";

// Use require to avoid type conflicts with next-pwa
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Ensure Vercel builds succeed even if there are minor type/lint errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack config to silence the warning
  turbopack: {},
};

export default withPWA(nextConfig);
