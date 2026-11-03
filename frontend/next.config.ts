import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5000";

    return [
      {
        source: "/expenses/:path*",
        destination: `${backendUrl}/expenses/:path*`,
      },
      {
        source: "/convert",
        destination: `${backendUrl}/convert`,
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
