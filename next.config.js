/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'flower-store-gt.onrender.com'],
    },
  },
}

module.exports = nextConfig