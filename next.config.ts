import type { NextConfig } from 'next'

const config: NextConfig = {
  // one static page: deployable anywhere, no server needed
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  // the dev badge sits on the act counter: keep the frame clean while reviewing
  devIndicators: false,
  transpilePackages: ['three'],
}

export default config
