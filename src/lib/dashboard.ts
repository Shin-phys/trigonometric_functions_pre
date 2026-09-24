/** ダッシュボードの集計（純粋関数。表示部品から切り離してテスト可能にしている） */
import { DASHBOARD } from "@/config/game";
import type { PresenceDoc, ResultDoc } from "@/lib/firebase/repository";

export type DashboardStats = {
  activeCount: number;
  playingCount: number;
  resultCount: number;
  avgAccuracy: number | null;
  avgScore: number | null;
  topScores: { name: string; score: number; stageId: string; accuracy: number }[];
  topGrowth: { name: string; growth: number; score: number; prevScore: number; stageId: string }[];
  weakPatterns: { key: string; n: number; wrong: number; rate: number }[];
};

export function computeStats(
  results: ResultDoc[],
  presence: (PresenceDoc & { uid: string })[],
  stageFilter: string | "all",
  nowMs: number,
): DashboardStats {
  const rows = stageFilter === "all" ? results : results.filter((r) => r.stageId === stageFilter);

  const active = presence.filter((p) => {
    const t = p.updatedAt?.toMillis?.() ?? 0;
    return nowMs - t < DASHBOARD.presenceTimeoutSec * 1000;
  });

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  // ハイスコア：1 人 1 件（その人の最高スコア）
  const bestByPlayer = new Map<string, ResultDoc>();
  for (const r of rows) {
    const k = `${r.uid}:${r.stageId}`;
    const cur = bestByPlayer.get(k);
    if (!cur || r.score > cur.score) bestByPlayer.set(k, r);
  }
  const topScores = [...bestByPlayer.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, DASHBOARD.topN)
    .map((r) => ({ name: r.name, score: r.score, stageId: r.stageId, accuracy: r.accuracy }));

  // 伸び率：前回スコアとの差（1 人 1 件、最大の伸び）
  const growthByPlayer = new Map<string, DashboardStats["topGrowth"][number]>();
  for (const r of rows) {
    if (r.prevScore === null || r.prevScore === undefined) continue;
    const g = r.score - r.prevScore;
    const k = `${r.uid}:${r.stageId}`;
    const cur = growthByPlayer.get(k);
    if (!cur || g > cur.growth) {
      growthByPlayer.set(k, { name: r.name, growth: g, score: r.score, prevScore: r.prevScore, stageId: r.stageId });
    }
  }
  const topGrowth = [...growthByPlayer.values()]
    .filter((g) => g.growth > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, DASHBOARD.topN);

  // 誤答率の高い出題パターン
  const agg = new Map<string, { n: number; wrong: number }>();
  for (const r of rows) {
    for (const [key, s] of Object.entries(r.patternStats ?? {})) {
      const a = agg.get(key) ?? { n: 0, wrong: 0 };
      a.n += s.n;
      a.wrong += s.wrong;
      agg.set(key, a);
    }
  }
  const weakPatterns = [...agg.entries()]
    .filter(([, a]) => a.n >= DASHBOARD.weakPatternMinCount && a.wrong > 0)
    .map(([key, a]) => ({ key, ...a, rate: a.wrong / a.n }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, DASHBOARD.weakPatternsN);

  return {
    activeCount: active.length,
    playingCount: active.filter((p) => p.status === "playing").length,
    resultCount: rows.length,
    avgAccuracy: avg(rows.map((r) => r.accuracy)),
    avgScore: avg(rows.map((r) => r.score)),
    topScores,
    topGrowth,
    weakPatterns,
  };
}
