/** ダッシュボードの集計（純粋関数。表示部品から切り離してテスト可能にしている） */
import { DASHBOARD } from "@/config/game";
import type { PresenceDoc, ResultDoc } from "@/lib/firebase/repository";

export type DashboardStats = {
  activeCount: number;
  playingCount: number;
  resultCount: number;
  avgAccuracy: number | null;
  /** クリアタイムの中央値（ミリ秒） */
  medianClearMs: number | null;
  topTimes: { name: string; clearMs: number; stageId: string; accuracy: number }[];
  /** ステージごとの到達者数と挑戦者数 */
  mastery: { stageId: string; mastered: number; players: number }[];
  weakPatterns: { key: string; n: number; wrong: number; rate: number }[];
};

export function computeStats(
  results: ResultDoc[],
  presence: (PresenceDoc & { uid: string })[],
  stageFilter: string | "all",
  nowMs: number,
  stageOrder: string[],
): DashboardStats {
  const rows = stageFilter === "all" ? results : results.filter((r) => r.stageId === stageFilter);

  const active = presence.filter((p) => {
    const t = p.updatedAt?.toMillis?.() ?? 0;
    return nowMs - t < DASHBOARD.presenceTimeoutSec * 1000;
  });

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const med = (xs: number[]) => {
    if (!xs.length) return null;
    const a = [...xs].sort((p, q) => p - q);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };

  // タイム TOP：1 人 1 件（その人のそのステージの最速）
  const bestByPlayer = new Map<string, ResultDoc>();
  for (const r of rows) {
    const k = `${r.uid}:${r.stageId}`;
    const cur = bestByPlayer.get(k);
    if (!cur || r.clearMs < cur.clearMs) bestByPlayer.set(k, r);
  }
  const topTimes = [...bestByPlayer.values()]
    .sort((a, b) => a.clearMs - b.clearMs)
    .slice(0, DASHBOARD.topN)
    .map((r) => ({ name: r.name, clearMs: r.clearMs, stageId: r.stageId, accuracy: r.accuracy }));

  // 到達者数：本日 1 回でも到達判定を満たした人
  const mastery = stageOrder
    .map((stageId) => {
      const rs = results.filter((r) => r.stageId === stageId);
      const players = new Set(rs.map((r) => r.uid));
      const mastered = new Set(rs.filter((r) => r.mastered).map((r) => r.uid));
      return { stageId, mastered: mastered.size, players: players.size };
    })
    .filter((m) => m.players > 0 && (stageFilter === "all" || m.stageId === stageFilter));

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
    medianClearMs: med(rows.map((r) => r.clearMs)),
    topTimes,
    mastery,
    weakPatterns,
  };
}
