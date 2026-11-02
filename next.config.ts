import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: true,
  register: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: false,
    clientsClaim: true,
    runtimeCaching: [
      // Tile server: CacheFirst, 24h expiration
      {
        urlPattern: /^https:\/\/tiles\.codevertexafrica\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "map-tiles",
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Routing API responses: NetworkFirst, 5 min expiration
      {
        urlPattern: /\/routing\/route\?/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "routing-api",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // @ts-ignore - Required for Turbopack in Next.js 16 (per CLI instruction)
  turbopack: {},
  // Tenant logos and icons come from auth (accounts/sso) or a tenant's media on the platform
  // domain. Without these the image optimizer refuses them (400) and the header shows alt text.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.codevertexafrica.com" },
    ],
  },
};

export default withPWA(nextConfig);
