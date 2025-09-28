/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'flower-store-gt.onrender.com'],
    },
  },
  async rewrites() {
    // Mirror rewrites to ensure /api/* proxies to the Express backend started by server.js
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig