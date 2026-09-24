/** スコア計算と 1 プレイの集計（仕様書 6節）。定数は config/game.ts */
import { SCORING } from "@/config/game";

export type AnswerLog = {
  statKey: string;
  correct: boolean;
  /** 問題表示から回答までの時間 */
  ms: number;
};

export type PatternStat = { n: number; wrong: number };

export type PlaySummary = {
  score: number;
  correct: number;
  total: number;
  accuracy: number; // 0〜1
  avgMs: number; // 正答の平均回答時間
  patternStats: Record<string, PatternStat>;
};

export function pointsFor(ms: number): number {
  const { basePerCorrect, maxSpeedBonus, fastMs, slowMs } = SCORING;
  const r = Math.min(1, Math.max(0, (slowMs - ms) / (slowMs - fastMs)));
  return basePerCorrect + maxSpeedBonus * r;
}

export function summarize(logs: AnswerLog[]): PlaySummary {
  const total = logs.length;
  const correctLogs = logs.filter((l) => l.correct);
  const correct = correctLogs.length;
  const accuracy = total ? correct / total : 0;
  const raw = correctLogs.reduce((s, l) => s + pointsFor(l.ms), 0);
  const score = Math.round(raw * Math.pow(accuracy, SCORING.accuracyExponent));
  const avgMs = correct ? Math.round(correctLogs.reduce((s, l) => s + l.ms, 0) / correct) : 0;

  const patternStats: Record<string, PatternStat> = {};
  for (const l of logs) {
    const s = (patternStats[l.statKey] ??= { n: 0, wrong: 0 });
    s.n++;
    if (!l.correct) s.wrong++;
  }
  return { score, correct, total, accuracy, avgMs, patternStats };
}
