import { Suspense } from "react";
import { PlayApp } from "@/components/game/PlayApp";

export const metadata = { title: "プレイ｜ベクトル分解タイムトライアル" };

export default function PlayPage() {
  return (
    <Suspense>
      <PlayApp />
    </Suspense>
  );
}
