/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@centralpay/types', '@centralpay/shared', '@centralpay/sdk'],
};

module.exports = nextConfig;
