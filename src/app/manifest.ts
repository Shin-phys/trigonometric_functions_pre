import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ベクトル分解タイムトライアル",
    short_name: "Vector Breakout",
    description: "高1物理基礎向け 超高速ベクトル成分分解トレーニング",
    start_url: `${base}/play/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [{ src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
