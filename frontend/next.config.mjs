/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // trailingSlash generates directory-based files (e.g. out/board/board/index.html)
  // which Firebase Hosting serves correctly for dynamic routes.
  trailingSlash: true,
  compress: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react", "framer-motion"],
  },
};

export default nextConfig;
