"use client";
import { useEffect } from "react";
import { FIGURE_COLORS } from "@/config/theme";
import { Tex } from "@/components/ui/Tex";
import type { Choice } from "@/lib/problems/types";

type Props = {
  choices: Choice[];
  /** フィードバック中：押した選択肢と正解 */
  reveal: { chosenId: string; correctId: string } | null;
  disabled: boolean;
  onAnswer: (id: string) => void;
  /** 振り返り画面などで小さく表示するとき */
  compact?: boolean;
};

/**
 * 2 択ボタン（並び固定）。左 sin・右 cos の縁を 対辺＝赤／隣辺＝青 にそろえる。
 * PC ではキー ← → 、1 2 、F J でも回答できる。
 */
export function ChoiceGrid({ choices, reveal, disabled, onAnswer, compact = false }: Props) {
  useEffect(() => {
    if (compact) return;
    const onKey = (e: KeyboardEvent) => {
      const left = ["1", "ArrowLeft", "f", "F"].includes(e.key);
      const right = ["2", "ArrowRight", "j", "J"].includes(e.key);
      const i = left ? 0 : right ? 1 : -1;
      if (i >= 0 && choices[i] && !disabled) {
        e.preventDefault();
        onAnswer(choices[i].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, disabled, onAnswer, compact]);

  return (
    <div className="grid h-full w-full grid-cols-2 gap-3">
      {choices.map((c) => {
        const toneColor = c.tone === "sin" ? FIGURE_COLORS.opposite : c.tone === "cos" ? FIGURE_COLORS.adjacent : null;
        let state = "bg-slate-800 active:bg-slate-700";
        let dim = false;
        if (reveal) {
          if (c.id === reveal.correctId) state = "bg-emerald-900/70 ring-4 ring-emerald-400";
          else if (c.id === reveal.chosenId) state = "bg-slate-800";
          else dim = true;
          if (c.id === reveal.chosenId && c.id !== reveal.correctId) dim = true;
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
            style={{ borderColor: toneColor ?? "#475569" }}
            className={`flex touch-manipulation select-none items-center justify-center rounded-2xl border-4 text-white transition-colors ${
              compact ? "py-2 text-lg" : "text-3xl sm:text-4xl"
            } ${state} ${dim ? "opacity-40" : ""}`}
          >
            <Tex tex={c.tex} />
          </button>
        );
      })}
    </div>
  );
}
