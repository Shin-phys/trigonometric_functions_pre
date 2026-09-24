"use client";
/**
 * 1 回のタイムトライアルの進行を管理する。
 *   countdown → playing → finished
 * 誤答時は wrongFlashMs の間フィードバックを表示し（操作不可）、その後次の問題へ。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GAME } from "@/config/game";
import type { StageConfig } from "@/config/stages";
import { generateProblem, type Problem } from "@/lib/problems";
import type { AnswerLog } from "@/lib/scoring";

export type GamePhase = "countdown" | "playing" | "finished";

export type Feedback = { chosenId: string; correctId: string; correct: boolean } | null;

export function useGame(stage: StageConfig, durationSec: number) {
  const [phase, setPhase] = useState<GamePhase>("countdown");
  const [countdown, setCountdown] = useState<number>(GAME.countdownSec);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(stage));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [remainingMs, setRemainingMs] = useState(durationSec * 1000);
  const [logs, setLogs] = useState<AnswerLog[]>([]);

  const shownAt = useRef(0);
  const endAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // カウントダウン
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      endAt.current = performance.now() + durationSec * 1000;
      shownAt.current = performance.now();
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, durationSec]);

  // 残り時間
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const tick = () => {
      const rest = Math.max(0, endAt.current - performance.now());
      setRemainingMs(rest);
      if (rest <= 0) {
        setPhase("finished");
        setFeedback(null);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const answer = useCallback(
    (choiceId: string) => {
      if (phase !== "playing" || feedback) return;
      const correct = choiceId === problem.correctId;
      const ms = Math.round(performance.now() - shownAt.current);
      setLogs((l) => [...l, { statKey: problem.statKey, correct, ms }]);
      setFeedback({ chosenId: choiceId, correctId: problem.correctId, correct });
      timer.current = setTimeout(
        () => {
          setProblem((prev) => generateProblem(stage, undefined, prev));
          setFeedback(null);
          shownAt.current = performance.now();
        },
        correct ? GAME.correctPauseMs : GAME.wrongFlashMs,
      );
    },
    [phase, feedback, problem, stage],
  );

  return { phase, countdown, problem, feedback, remainingMs, logs, answer };
}
