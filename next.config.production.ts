import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Hostinger deployment
  output: 'export',

  // Add trailing slash for better compatibility with static hosting
  trailingSlash: true,

  // Disable server-side features that don't work with static export
  images: {
    unoptimized: true,
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

  // Build configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable React strict mode for production stability
  reactStrictMode: false,

  // Asset prefix for CDN (optional - uncomment and set your CDN URL)
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://your-cdn-url.com' : '',

  // Generate sitemap and robots.txt friendly URLs
  generateEtags: false,

  // Optimize for static hosting
  poweredByHeader: false,

  // Custom webpack config for production optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Reduce bundle size
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      };
    }

    return config;
  },

  // Environment variables that will be available at build time
  env: {
    CUSTOM_BUILD_TIME: new Date().toISOString(),
  },

  // Redirect configuration (handled by _redirects file instead)
  async redirects() {
    return [
      // Handle www subdomain
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.yourdomain.com', // Replace with your domain
          },
        ],
        destination: 'https://yourdomain.com/:path*', // Replace with your domain
        permanent: true,
      },
    ];
  },

  // Headers configuration (handled by _headers file instead)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
