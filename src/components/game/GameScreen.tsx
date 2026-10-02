"use client";
import { useEffect, useRef } from "react";
import { FigureSvg } from "@/components/figure/FigureSvg";
import { GAME } from "@/config/game";
import { goalOf, type StageConfig } from "@/config/stages";
import { useGame } from "@/hooks/useGame";
import { formatSec } from "@/lib/format";
import type { AnswerLog } from "@/lib/scoring";
import { ChoiceGrid } from "./ChoiceGrid";
import { FeedbackLegend } from "./FeedbackLegend";

type Props = {
  stage: StageConfig;
  onFinish: (logs: AnswerLog[], clearMs: number) => void;
  onQuit: () => void;
};

/**
 * プレイ画面（山札の枚数だけ正解でゴール）。
 * スマホ縦：上に図・下に 2 択／横画面：左に図・右に 2 択（仕様書 8節）
 */
export function GameScreen({ stage, onFinish, onQuit }: Props) {
  const { phase, countdown, problem, feedback, elapsedMs, clearMs, logs, correctSoFar, answer } = useGame(stage);

  const finished = useRef(false);
  useEffect(() => {
    if (phase === "finished" && !finished.current) {
      finished.current = true;
      onFinish(logs, clearMs);
    }
  }, [phase, logs, clearMs, onFinish]);

  const goal = goalOf(stage);
  const wrongCount = logs.length - correctSoFar;
  const locked = !!feedback && !feedback.correct;

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-white">
      {/* 上部バー */}
      <div className="flex items-center gap-3 px-3 pt-2 text-sm">
        <button onClick={onQuit} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800" aria-label="やめる">
          ✕
        </button>
        <span className="truncate text-slate-400">{stage.title}</span>
        {wrongCount > 0 && <span className="ml-auto tabular-nums text-rose-400">× {wrongCount}</span>}
        <span className={`${wrongCount > 0 ? "" : "ml-auto"} w-20 text-right text-xl font-bold tabular-nums`}>
          {formatSec(elapsedMs)}
          <span className="text-sm font-normal text-slate-400">秒</span>
        </span>
      </div>
      {/* 正解数の進み具合（ゴールの数だけマス） */}
      <div className="mx-3 mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${goal}, 1fr)` }}>
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} className={`h-2 rounded-full ${i < correctSoFar ? "bg-amber-400" : "bg-slate-800"}`} />
        ))}
      </div>

      {phase === "countdown" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-slate-400">{goal} 問正解でゴール</p>
          <p className="text-8xl font-bold tabular-nums">{countdown > 0 ? countdown : "GO"}</p>
          <p className="text-sm text-slate-500">まちがえると {GAME.wrongLockMs / 1000} 秒ストップ</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 landscape:flex-row">
          <div className="relative flex min-h-0 flex-[3] flex-col rounded-2xl bg-slate-900">
            <p className="px-3 pt-2 text-center text-sm text-slate-400">{problem.prompt}</p>
            <FigureSvg figure={problem.figure} feedback={locked} className="min-h-0 w-full flex-1" />
            {locked && (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                  <FeedbackLegend generator={stage.generator} />
                </div>
                <LockBar key={logs.length} ms={GAME.wrongLockMs} />
              </>
            )}
            {feedback?.correct && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl text-emerald-400/70">
                ○
              </div>
            )}
          </div>
          <div className="min-h-0 flex-[1.4] landscape:flex-[2]">
            <ChoiceGrid
              choices={problem.choices}
              reveal={locked ? feedback : null}
              disabled={phase !== "playing" || !!feedback}
              onAnswer={answer}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** ロック中の残り時間バー */
function LockBar({ ms }: { ms: number }) {
  return (
    <div className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-2xl">
      <div className="h-full bg-rose-500" style={{ animation: `vb-shrink ${ms}ms linear forwards` }} />
    </div>
  );
}
