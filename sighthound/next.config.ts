import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true, // or any other existing settings

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
