import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // @ts-ignore - Required for Turbopack in Next.js 16 (per CLI instruction)
  turbopack: {},
};

export default withPWA(nextConfig);
