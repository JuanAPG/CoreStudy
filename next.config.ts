import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: ["localhost:3000", "*.devtunnels.ms", "*.githubpreview.dev", "*.vercel.app"],
    },
  },
};

export default nextConfig;
