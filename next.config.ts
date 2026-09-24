import type { NextConfig } from "next";

/**
 * GitHub Pages（https://<user>.github.io/<repo>/）で配信するため静的エクスポートする。
 * basePath はビルド時の環境変数 NEXT_PUBLIC_BASE_PATH で与える（ローカル開発では空）。
 *   例）NEXT_PUBLIC_BASE_PATH=/trigonometric_functions_pre
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
