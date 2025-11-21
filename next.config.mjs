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
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.pixabay.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination:
          'https://api.farcaster.xyz/miniapps/hosted-manifest/019a95f6-0a22-8178-7c14-7ff79576e889',
        permanent: false,
      },
      {
        source: '/',
        destination: '/home-dashboard',
        permanent: false,
      },
    ];
  },

  webpack(config) {
    //
    // 1️⃣ Existing DhiWise loader — keep it
    //
    config.module.rules.push({
      test: /\.(jsx|tsx)$/,
      exclude: [/node_modules/],
      use: [
        {
          loader: '@dhiwise/component-tagger/nextLoader',
        },
      ],
    });

    //
    // 2️⃣ MetaMask SDK Fix — Option 2 addition
    // Prevent Webpack from trying to bundle react-native storage layer
    //
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },
};

export default nextConfig;
