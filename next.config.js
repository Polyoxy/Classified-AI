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
  },
  // Add custom headers to allow connecting to the Ollama server
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // In production, you should restrict this to specific origins
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          }
        ],
      },
    ];
  },
  // Enable response compression
  compress: true
};

module.exports = nextConfig; 