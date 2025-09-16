import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Next.js infiera mal el root por lockfiles externos
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
