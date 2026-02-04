/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for optimized Docker builds
  output: 'standalone',
  transpilePackages: ['@iris-aegis/protocol'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/aegis/:path*',
        destination: `${process.env.AEGIS_API_URL || 'http://localhost:8080'}/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // Handle mermaid ESM
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    return config;
  },
}

module.exports = nextConfig
