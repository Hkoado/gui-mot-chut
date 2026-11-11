import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  devIndicators: false,
  allowedDevOrigins: ['192.168.1.40'],
};

export default nextConfig;