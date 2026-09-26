"use client";
/**
 * 1 ラウンド（12 問正解でゴール）の進行を管理する。
 *   countdown → playing → finished
 * 誤答時は wrongLockMs の間「対辺＝赤／隣辺＝青」を表示して操作不可にし、その後は新しい問題へ進む
 * （誤答した問題は正解数に数えない）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GAME } from "@/config/game";
import type { StageConfig } from "@/config/stages";
import { createProblemSource, type Problem } from "@/lib/problems";
import type { AnswerLog } from "@/lib/scoring";

export type GamePhase = "countdown" | "playing" | "finished";

export type Feedback = { chosenId: string; correctId: string; correct: boolean } | null;

export function useGame(stage: StageConfig) {
  const source = useRef(createProblemSource(stage));
  const [phase, setPhase] = useState<GamePhase>("countdown");
  const [countdown, setCountdown] = useState<number>(GAME.countdownSec);
  const [problem, setProblem] = useState<Problem>(() => source.current.next());
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [clearMs, setClearMs] = useState(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);

  const startAt = useRef(0);
  const shownAt = useRef(0);
  const correctCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // カウントダウン
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      startAt.current = performance.now();
      shownAt.current = startAt.current;
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // 経過時間の表示
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const tick = () => {
      setElapsedMs(performance.now() - startAt.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const answer = useCallback(
    (choiceId: string) => {
      if (phase !== "playing" || feedback) return;
      const now = performance.now();
      const correct = choiceId === problem.correctId;
      const ms = Math.round(now - shownAt.current);
      setLogs((l) => [...l, { statKey: problem.statKey, correct, ms, chosenId: choiceId, problem }]);
      setFeedback({ chosenId: choiceId, correctId: problem.correctId, correct });

      if (correct) {
        correctCount.current++;
        if (correctCount.current >= GAME.goalCorrect) {
          // 最後の正解の瞬間でタイムを確定
          const t = now - startAt.current;
          setClearMs(t);
          setElapsedMs(t);
          timer.current = setTimeout(() => setPhase("finished"), 250);
          return;
        }
      }
      timer.current = setTimeout(
        () => {
          setProblem(source.current.next());
          setFeedback(null);
          shownAt.current = performance.now();
        },
        correct ? GAME.correctPauseMs : GAME.wrongLockMs,
      );
    },
    [phase, feedback, problem],
  );

  const correctSoFar = logs.filter((l) => l.correct).length;

  return { phase, countdown, problem, feedback, elapsedMs, clearMs, logs, correctSoFar, answer };
}
