import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable React strict mode for production stability
  reactStrictMode: false,
  // Production optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable webpack hot module replacement in development
      config.watchOptions = {
        ignored: ["**/*"], // Ignore all file changes
      };
    }

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      };
    }

    return config;
  },
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
    domains: ["res.cloudinary.com", "cloudinary.com"],
  },
  // Production settings
  poweredByHeader: false,
  generateEtags: false,
  // Compress pages
  compress: true,
  // Custom server compatibility
  serverExternalPackages: ["prisma", "@prisma/client"],
  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
