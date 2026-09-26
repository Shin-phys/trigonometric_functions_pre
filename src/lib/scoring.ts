/**
 * 1 プレイの集計と到達（自動化）判定（仕様書 6節）。定数は config/game.ts
 *   ゲームの記録 … クリアタイム（12 問正解するまでの時間）
 *   到達度      … 正答率 と 正解時の反応時間の中央値（直近数回分をまとめて判定）
 */
import { MASTERY } from "@/config/game";
import type { Problem } from "@/lib/problems/types";

export type AnswerLog = {
  statKey: string;
  correct: boolean;
  /** 問題表示から回答までの時間 */
  ms: number;
  chosenId: string;
  /** 振り返り表示用（端末内だけで使い、送信しない） */
  problem: Problem;
};

export type PatternStat = { n: number; wrong: number };

export type PlaySummary = {
  /** クリアタイム（ミリ秒） */
  clearMs: number;
  correct: number;
  total: number;
  accuracy: number; // 0〜1
  /** 正解時の反応時間の中央値（ミリ秒） */
  medianMs: number;
  /** 正解時の反応時間の一覧（到達判定用） */
  rts: number[];
  patternStats: Record<string, PatternStat>;
};

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const a = [...xs].sort((p, q) => p - q);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

export function summarize(logs: Omit<AnswerLog, "problem" | "chosenId">[], clearMs: number): PlaySummary {
  const total = logs.length;
  const rts = logs.filter((l) => l.correct).map((l) => l.ms);
  const correct = rts.length;
  const patternStats: Record<string, PatternStat> = {};
  for (const l of logs) {
    const s = (patternStats[l.statKey] ??= { n: 0, wrong: 0 });
    s.n++;
    if (!l.correct) s.wrong++;
  }
  return {
    clearMs: Math.round(clearMs),
    correct,
    total,
    accuracy: total ? correct / total : 0,
    medianMs: median(rts),
    rts,
    patternStats,
  };
}

export type MasteryResult = {
  /** 判定に使ったプレイ回数 */
  sessions: number;
  accuracy: number;
  medianMs: number;
  accuracyOk: boolean;
  speedOk: boolean;
  /** 規定回数そろっていて、両条件を満たす */
  mastered: boolean;
};

/** 直近のプレイ（新しい順でも古い順でもよい）から到達判定する */
export function judgeMastery(sessions: { correct: number; total: number; rts: number[] }[]): MasteryResult {
  const recent = sessions.slice(-MASTERY.windowSessions);
  const correct = recent.reduce((s, x) => s + x.correct, 0);
  const total = recent.reduce((s, x) => s + x.total, 0);
  const accuracy = total ? correct / total : 0;
  const medianMs = median(recent.flatMap((x) => x.rts));
  const accuracyOk = total > 0 && accuracy >= MASTERY.minAccuracy;
  const speedOk = medianMs > 0 && medianMs <= MASTERY.maxMedianMs;
  return {
    sessions: recent.length,
    accuracy,
    medianMs,
    accuracyOk,
    speedOk,
    mastered: recent.length >= MASTERY.windowSessions && accuracyOk && speedOk,
  };
}
