"use client";
/**
 * 間違えた問題だけの復習。時間は計らず、記録もしない。
 * 同じ図をもう一度出し、間違えたら最後に回す。全部正解したら終了。
 */
import { useState } from "react";
import { FigureSvg } from "@/components/figure/FigureSvg";
import { GAME } from "@/config/game";
import type { StageConfig } from "@/config/stages";
import type { Problem } from "@/lib/problems/types";
import { ChoiceGrid } from "./ChoiceGrid";
import { FeedbackLegend } from "./FeedbackLegend";

type Props = { stage: StageConfig; problems: Problem[]; onDone: () => void };

export function ReviewScreen({ stage, problems, onDone }: Props) {
  const [queue, setQueue] = useState(problems);
  const [reveal, setReveal] = useState<{ chosenId: string; correctId: string } | null>(null);
  const [cleared, setCleared] = useState(0);
  const current = queue[0];

  const answer = (id: string) => {
    if (reveal || !current) return;
    const correct = id === current.correctId;
    setReveal({ chosenId: id, correctId: current.correctId });
    setTimeout(
      () => {
        setQueue((q) => (correct ? q.slice(1) : [...q.slice(1), q[0]]));
        if (correct) setCleared((c) => c + 1);
        setReveal(null);
      },
      correct ? 300 : GAME.wrongLockMs,
    );
  };

  const wrongShown = !!reveal && reveal.chosenId !== reveal.correctId;

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-white">
      <div className="flex items-center gap-3 px-3 pt-2 text-sm">
        <button onClick={onDone} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800">
          ✕
        </button>
        <span className="text-slate-400">復習（時間は計りません）</span>
        <span className="ml-auto tabular-nums">
          {cleared}/{problems.length}
        </span>
      </div>

      {!current ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <p className="text-3xl font-bold text-emerald-400">復習完了！</p>
          <button onClick={onDone} className="rounded-xl bg-amber-400 px-8 py-3 font-bold text-slate-900">
            結果にもどる
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 landscape:flex-row">
          <div className="relative flex min-h-0 flex-[3] flex-col rounded-2xl bg-slate-900">
            <p className="px-3 pt-2 text-center text-sm text-slate-400">{current.prompt}</p>
            <FigureSvg figure={current.figure} feedback={wrongShown} className="min-h-0 w-full flex-1" />
            {wrongShown && (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                <FeedbackLegend generator={stage.generator} />
              </div>
            )}
            {reveal && !wrongShown && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl text-emerald-400/70">
                ○
              </div>
            )}
          </div>
          <div className="min-h-0 flex-[1.4] landscape:flex-[2]">
            <ChoiceGrid choices={current.choices} reveal={wrongShown ? reveal : null} disabled={!!reveal} onAnswer={answer} />
          </div>
        </div>
      )}
    </div>
  );
}
