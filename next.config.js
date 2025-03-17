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
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* wss://localhost:* https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.com https://*.google-analytics.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.firebaseapp.com https://*.firebase.com https://*.google-analytics.com; frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com https://identitytoolkit.googleapis.com; worker-src 'self' blob:;"
              : "default-src 'self'; connect-src 'self' ws://localhost:* wss://localhost:* https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.com https://*.google-analytics.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com; script-src 'self' 'unsafe-inline' https://*.firebaseapp.com https://*.googleapis.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.firebaseapp.com https://*.firebase.com https://*.google-analytics.com; frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com https://identitytoolkit.googleapis.com; worker-src 'self' blob:;"
          }
        ],
      },
    ];
  },
  // Enable response compression
  compress: true
};

module.exports = nextConfig; 