/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ledgerhq/devices',
    '@ledgerhq/errors',
    '@ledgerhq/logs',
    '@ledgerhq/hw-transport',
    '@ledgerhq/hw-transport-webhid',
  ],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, os: false };
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
