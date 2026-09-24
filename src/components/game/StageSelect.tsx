"use client";
import { GAME } from "@/config/game";
import { STAGES, type StageConfig } from "@/config/stages";

type Props = {
  duration: number | null;
  onDuration: (sec: number | null) => void;
  onSelect: (stage: StageConfig) => void;
};

/** ステージ選択（基本モード Stage 0〜3 と 発展モード）と制限時間の選択 */
export function StageSelect({ duration, onDuration, onSelect }: Props) {
  const basic = STAGES.filter((s) => s.mode === "basic");
  const advanced = STAGES.filter((s) => s.mode === "advanced");

  const card = (s: StageConfig) => (
    <button
      key={s.id}
      onClick={() => onSelect(s)}
      className="flex flex-col items-start rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left hover:border-amber-400"
    >
      <span className="text-lg font-bold">{s.title}</span>
      <span className="text-sm text-slate-400">{s.subtitle}</span>
      <span className="mt-1 text-xs text-slate-500">{duration ?? s.defaultDurationSec} 秒</span>
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">制限時間</span>
        <button
          onClick={() => onDuration(null)}
          className={`rounded-full px-3 py-1 ${duration === null ? "bg-amber-400 text-slate-900" : "bg-slate-800"}`}
        >
          標準
        </button>
        {GAME.durationOptions.map((t) => (
          <button
            key={t}
            onClick={() => onDuration(t)}
            className={`rounded-full px-3 py-1 tabular-nums ${duration === t ? "bg-amber-400 text-slate-900" : "bg-slate-800"}`}
          >
            {t}秒
          </button>
        ))}
      </div>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-slate-400">基本モード　分解マスター</h2>
        {basic.map(card)}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-slate-400">発展モード</h2>
        {advanced.map(card)}
      </section>
    </div>
  );
}
