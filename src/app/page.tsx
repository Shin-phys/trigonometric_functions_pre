import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-slate-950 p-6 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">ベクトル分解タイムトライアル</h1>
        <p className="mt-1 text-slate-400">Vector Breakout</p>
        <p className="mt-4 text-sm text-slate-400">図を見て、成分を直感で選ぶ。1 問 1 秒のウォームアップ。</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link href="/play/" className="rounded-2xl bg-amber-400 py-4 text-center text-xl font-bold text-slate-900">
          プレイする（生徒）
        </Link>
        <Link href="/dashboard/" className="rounded-2xl bg-slate-800 py-4 text-center text-lg font-bold">
          ダッシュボード（教員・投影用）
        </Link>
      </div>
    </main>
  );
}
