"use client";
import { useEffect, useRef } from "react";
import { FigureSvg } from "@/components/figure/FigureSvg";
import { ChoiceGrid } from "./ChoiceGrid";
import type { StageConfig } from "@/config/stages";
import { useGame } from "@/hooks/useGame";
import type { AnswerLog } from "@/lib/scoring";

type Props = {
  stage: StageConfig;
  durationSec: number;
  onFinish: (logs: AnswerLog[]) => void;
  onQuit: () => void;
};

/**
 * プレイ画面。スマホ縦：上に図・下に 2×2 ボタン／横画面：左に図・右にボタン（仕様書 8節）
 */
export function GameScreen({ stage, durationSec, onFinish, onQuit }: Props) {
  const { phase, countdown, problem, feedback, remainingMs, logs, answer } = useGame(stage, durationSec);

  const finished = useRef(false);
  useEffect(() => {
    if (phase === "finished" && !finished.current) {
      finished.current = true;
      onFinish(logs);
    }
  }, [phase, logs, onFinish]);

  const ratio = remainingMs / (durationSec * 1000);
  const correctCount = logs.filter((l) => l.correct).length;

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-white">
      {/* 上部バー */}
      <div className="flex items-center gap-3 px-3 pt-2 text-sm">
        <button onClick={onQuit} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800">
          ✕
        </button>
        <span className="truncate text-slate-400">{stage.title}</span>
        <span className="ml-auto tabular-nums">
          <span className="text-emerald-400">○ {correctCount}</span>
          <span className="ml-3 text-rose-400">× {logs.length - correctCount}</span>
        </span>
        <span className="w-12 text-right text-lg font-bold tabular-nums">{Math.ceil(remainingMs / 1000)}</span>
      </div>
      <div className="mx-3 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full ${ratio < 0.2 ? "bg-rose-500" : "bg-amber-400"}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      {phase === "countdown" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-slate-400">{problem.prompt}</p>
          <p className="text-8xl font-bold tabular-nums">{countdown > 0 ? countdown : "GO"}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 landscape:flex-row">
          <div className="relative flex min-h-0 flex-[3] flex-col rounded-2xl bg-slate-900 landscape:flex-[3]">
            <p className="px-3 pt-2 text-center text-sm text-slate-400">{problem.prompt}</p>
            <FigureSvg figure={problem.figure} feedback={!!feedback && !feedback.correct} className="min-h-0 w-full flex-1" />
            {feedback && !feedback.correct && (
              <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-4 text-sm font-bold">
                {stage.generator === "tan" ? (
                  <span>
                    <span className="text-rose-400">対辺</span> ÷ <span className="text-blue-400">隣辺</span> ＝ tanθ
                  </span>
                ) : (
                  <>
                    <span className="text-rose-400">対辺 → sin</span>
                    <span className="text-blue-400">隣辺 → cos</span>
                  </>
                )}
              </div>
            )}
            {feedback?.correct && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl text-emerald-400/70">
                ○
              </div>
            )}
          </div>
          <div className="min-h-0 flex-[2] landscape:flex-[2]">
            <ChoiceGrid
              choices={problem.choices}
              reveal={feedback && !feedback.correct ? feedback : null}
              disabled={phase !== "playing" || !!feedback}
              onAnswer={answer}
            />
          </div>
        </div>
      )}
    </div>
  );
}
