import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Add Next.js config as needed */
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
