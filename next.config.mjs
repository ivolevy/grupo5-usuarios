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
  output: 'standalone',
  // Ensure Next's output file tracing uses the project root, not parent directories
  outputFileTracingRoot: process.cwd(),
  trailingSlash: false,
}

export default nextConfig
