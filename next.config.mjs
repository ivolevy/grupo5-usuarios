/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración optimizada para Vercel
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: [],
  // Configuración de trailing slash para compatibilidad
  trailingSlash: false,
  // Configuración para evitar errores de exportación
  generateEtags: false,
  poweredByHeader: false,
}

export default nextConfig
