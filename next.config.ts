import type { NextConfig } from 'next'

const config: NextConfig = {
  // one static page: deployable anywhere, no server needed
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['three'],
}

export default config
