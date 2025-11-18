/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
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
      // Farcaster Domain Verification Redirect (Temporary 307)
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019a95f6-0a22-8178-7c14-7ff79576e889',
        permanent: false,
      },
      // Root (/) to Home Dashboard Redirect
      {
        source: '/',
        destination: '/home-dashboard',
        permanent: false,
      },
    ];
  },
  webpack(config) {
    // Webpack rule for the critical @dhiwise/component-tagger
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
