import { Suspense } from "react";
import { DashboardApp } from "@/components/dashboard/DashboardApp";

export const metadata = { title: "ダッシュボード｜ベクトル分解タイムトライアル" };

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardApp />
    </Suspense>
  );
}
