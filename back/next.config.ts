import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Next.js infiera mal el root por lockfiles externos
  outputFileTracingRoot: __dirname,
  // Deshabilitar ESLint temporalmente para el deploy
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
