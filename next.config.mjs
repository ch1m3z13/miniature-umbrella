/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    // Ignores build errors, matching your setting
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignores ESLint issues during the Vercel build process, matching your setting
    ignoreDuringBuilds: true,
  },
  images: {
    // Merged remote image patterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pixabay.com',
      },
    ],
  },
  async redirects() {
    return [
      // 1. Farcaster Domain Verification Redirect (Temporary 307)
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a95f6-0a22-8178-7c14-7ff79576e889',
        permanent: false,
      },
      // 2. Root (/) to Home Dashboard Redirect (Temporary)
      {
        source: '/',
        destination: '/home-dashboard',
        permanent: false,
      },
    ];
  },
  webpack(config) {
    // Critical Webpack rule for the @dhiwise/component-tagger
    [cite_start]// This is required for Rocket.new integration[cite: 3, 12].
    config.module.rules.push({
      test: /\.(jsx|tsx)$/,
      exclude: [/node_modules/],
      use: [{
        loader: '@dhiwise/component-tagger/nextLoader',
      }],
    });
    return config;
  },
};

export default nextConfig;
