import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  assetPrefix: "/react-stocks-dashboard",
  // basePath: "/react-stocks-dashboard",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/react-stocks-dashboard"
  }
};

export default nextConfig;
