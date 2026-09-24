"use client";
import { describeStatKey } from "@/content/labels";
import type { StageConfig } from "@/config/stages";
import type { HistoryEntry } from "@/lib/storage/local";
import type { PlaySummary } from "@/lib/scoring";

type Props = {
  stage: StageConfig;
  summary: PlaySummary;
  prev: HistoryEntry | null;
  best: number | null;
  saveState: "local" | "saving" | "saved" | "error";
  onRetry: () => void;
  onBack: () => void;
};

/** リザルト：スコア・正答率・前回の自分との比較（仕様書 7-①） */
export function ResultScreen({ stage, summary, prev, best, saveState, onRetry, onBack }: Props) {
  const diff = prev ? summary.score - prev.score : null;
  const growth = prev && prev.score > 0 ? Math.round(((summary.score - prev.score) / prev.score) * 100) : null;
  const weak = Object.entries(summary.patternStats)
    .filter(([, s]) => s.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <p className="text-center text-sm text-slate-400">{stage.title}</p>
      <div className="text-center">
        <p className="text-sm text-slate-400">スコア</p>
        <p className="text-7xl font-bold tabular-nums text-amber-400">{summary.score}</p>
        {diff !== null && (
          <p className={`mt-1 text-lg font-bold ${diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            前回 {prev!.score} → {diff >= 0 ? "+" : ""}
            {diff}
            {growth !== null && `（${growth >= 0 ? "+" : ""}${growth}%）`}
          </p>
        )}
        {best !== null && summary.score > best && <p className="mt-1 font-bold text-amber-300">自己ベスト更新！</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="正答率" value={`${Math.round(summary.accuracy * 100)}%`} />
        <Stat label="正解数" value={`${summary.correct}/${summary.total}`} />
        <Stat label="平均時間" value={summary.avgMs ? `${(summary.avgMs / 1000).toFixed(2)}秒` : "—"} />
      </div>

      {weak.length > 0 && (
        <div className="rounded-2xl bg-slate-800 p-4">
          <p className="mb-2 text-sm font-bold text-slate-400">まちがえた問題</p>
          <ul className="flex flex-col gap-1 text-sm">
            {weak.map(([key, s]) => (
              <li key={key} className="flex justify-between">
                <span>{describeStatKey(key).text}</span>
                <span className="tabular-nums text-rose-400">
                  {s.wrong}/{s.n}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-xl bg-slate-800 py-3 font-bold">
          ステージ選択
        </button>
        <button onClick={onRetry} className="flex-1 rounded-xl bg-amber-400 py-3 font-bold text-slate-900">
          もう一度
        </button>
      </div>
      <p className="text-center text-xs text-slate-500">
        {saveState === "saving" && "記録を送信中…"}
        {saveState === "saved" && "記録を送信しました"}
        {saveState === "error" && "記録を送信できませんでした（この端末には保存済み）"}
        {saveState === "local" && "記録はこの端末に保存しました"}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-800 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
