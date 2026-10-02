"use client";
import { useEffect, useState } from "react";
import { GAME } from "@/config/game";
import { STAGES, goalOf, type StageConfig } from "@/config/stages";
import { judgeMastery } from "@/lib/scoring";
import { loadHistory } from "@/lib/storage/local";
import { formatSec } from "@/lib/format";

type Props = { guest: boolean; onSelect: (stage: StageConfig) => void };

type StageRecord = { best: number | null; mastered: boolean };

/** ステージ選択。自己ベストと到達状況も表示する */
export function StageSelect({ guest, onSelect }: Props) {
  const [records, setRecords] = useState<Map<string, StageRecord>>(new Map());

  useEffect(() => {
    const m = new Map<string, StageRecord>();
    for (const s of STAGES) {
      const h = loadHistory(s.id, guest);
      m.set(s.id, {
        best: h.length ? Math.min(...h.map((x) => x.clearMs)) : null,
        mastered: judgeMastery(h).mastered,
      });
    }
    setRecords(m);
  }, [guest]);

  const card = (s: StageConfig) => {
    const r = records.get(s.id);
    return (
      <button
        key={s.id}
        onClick={() => onSelect(s)}
        className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-left hover:border-amber-400"
      >
        <span className="flex flex-1 flex-col">
          <span className="text-lg font-bold">{s.title}</span>
          <span className="text-sm text-slate-400">{s.subtitle}</span>
          <span className="text-xs text-slate-500">{goalOf(s)} 問正解でゴール</span>
        </span>
        <span className="flex flex-col items-end text-xs">
          {!guest && r?.mastered && <span className="rounded-full bg-emerald-500 px-2 py-0.5 font-bold text-slate-900">到達</span>}
          {r?.best != null && <span className="mt-1 tabular-nums text-slate-400">ベスト {formatSec(r.best)}秒</span>}
        </span>
      </button>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <p className="text-center text-sm text-slate-400">
        決められた数だけ正解するまでのタイムを競う。まちがえると {GAME.wrongLockMs / 1000} 秒ストップ。
      </p>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-slate-400">基本モード　分解マスター</h2>
        {STAGES.filter((s) => s.mode === "basic").map(card)}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-slate-400">発展モード</h2>
        {STAGES.filter((s) => s.mode === "advanced").map(card)}
      </section>
    </div>
  );
}
