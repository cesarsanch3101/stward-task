// Static export only for production builds (Firebase Hosting).
// In dev mode, Next.js dev server doesn't support dynamic routes with output:"export"
// because it can't pre-render unknown IDs — Firebase handles that with its ** rewrite.
const isProduction = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isProduction ? "export" : undefined,
  // trailingSlash generates directory-based files (e.g. out/board/board/index.html)
  // which Firebase Hosting serves correctly for dynamic routes.
  trailingSlash: isProduction,
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
