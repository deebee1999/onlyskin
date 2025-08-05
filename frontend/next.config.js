/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* to your backend on port 5000
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
