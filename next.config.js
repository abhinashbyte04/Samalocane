/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
  // Environment variables exposed to browser if needed
  env: {
    NEXT_PUBLIC_APP_NAME: 'Samālōcane',
    NEXT_PUBLIC_APP_TAGLINE: 'Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas'
  }
};

module.exports = nextConfig;

