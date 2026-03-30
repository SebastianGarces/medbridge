import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.medbridge.com",
      },
      {
        protocol: "https",
        hostname: "cdn.medbridge.com",
      },
    ],
  },
  transpilePackages: ["remotion", "@remotion/player", "@remotion/transitions"],
};

export default nextConfig;
