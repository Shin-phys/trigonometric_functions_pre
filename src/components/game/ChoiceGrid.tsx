"use client";
import { useEffect } from "react";
import { Tex } from "@/components/ui/Tex";
import type { Choice } from "@/lib/problems/types";

type Props = {
  choices: Choice[];
  /** フィードバック中：押した選択肢と正解 */
  reveal: { chosenId: string; correctId: string } | null;
  disabled: boolean;
  onAnswer: (id: string) => void;
};

/** 2×2 の 4 択ボタン。PC ではキー 1〜4 でも回答できる */
export function ChoiceGrid({ choices, reveal, disabled, onAnswer }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ["1", "2", "3", "4"].indexOf(e.key);
      if (i >= 0 && choices[i] && !disabled) onAnswer(choices[i].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, disabled, onAnswer]);

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-3">
      {choices.map((c, i) => {
        let state = "border-slate-600 bg-slate-800 active:bg-slate-700";
        if (reveal) {
          if (c.id === reveal.correctId) state = "border-emerald-400 bg-emerald-900/60";
          else if (c.id === reveal.chosenId) state = "border-rose-500 bg-rose-950/70 opacity-70";
          else state = "border-slate-700 bg-slate-800 opacity-40";
        }
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            // タッチ端末で 300ms 遅延やダブルタップ拡大を起こさないよう pointerdown で即時反応
            onPointerDown={(e) => {
              e.preventDefault();
              if (!disabled) onAnswer(c.id);
            }}
            className={`relative flex touch-manipulation select-none items-center justify-center rounded-2xl border-2 text-2xl text-white transition-colors sm:text-3xl ${state}`}
          >
            <span className="absolute left-2 top-1 hidden text-xs text-slate-500 lg:block">{i + 1}</span>
            <Tex tex={c.tex} />
          </button>
        );
      })}
    </div>
  );
}
