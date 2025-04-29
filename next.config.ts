import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  assetPrefix: process.env.NODE_ENV === 'production' ? '/react-stocks-dashboard' : '',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NODE_ENV === 'production' ? '/react-stocks-dashboard' : ''
  }
};

export default nextConfig;