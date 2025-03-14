/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Ensure compatibility with Electron
  images: {
    unoptimized: true,
  },
  // Configure webpack to avoid using eval in development mode
  webpack: (config, { dev, isServer }) => {
    // Use a more secure devtool option that doesn't use eval
    if (dev) {
      config.devtool = 'source-map';
    }
    return config;
  }
};

module.exports = nextConfig; 