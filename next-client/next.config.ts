import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "**.com",
      },
    ],
    unoptimized: process.env.NODE_ENV === "development", // 仅开发时禁用图片优化
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
    };
    return config;
  },
  turbopack: {
    root: path.resolve(__dirname, '../'), // 指定工作区根目录的绝对路径
  },
};

export default nextConfig;
