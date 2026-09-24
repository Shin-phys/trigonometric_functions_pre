/** ダッシュボードの見本データ（?demo=1）。Firebase なしで表示を確認するためのもの */
import type { PresenceDoc, ResultDoc } from "@/lib/firebase/repository";
import type { Timestamp } from "firebase/firestore";

const ts = (ms: number) => ({ toMillis: () => ms }) as unknown as Timestamp;

export function demoResults(): ResultDoc[] {
  const names = ["1", "2", "3", "5", "8", "11", "13", "17", "21", "24", "ぴかりん", "たける"];
  return names.map((name, i) => {
    const total = 30 + ((i * 7) % 15);
    const correct = Math.max(10, total - (i % 5) - 1);
    const accuracy = correct / total;
    const score = Math.round(correct * 125 * accuracy * accuracy);
    return {
      uid: `demo${i}`,
      name,
      stageId: i % 3 === 0 ? "S2" : "S1",
      durationSec: 60,
      score,
      correct,
      total,
      accuracy,
      avgMs: 800 + i * 20,
      prevScore: i % 4 === 0 ? null : score - 150 + i * 23,
      patternStats: {
        "S1:vertical:opposite": { n: 10, wrong: 3 + (i % 3) },
        "S1:vertical:adjacent": { n: 10, wrong: 2 },
        "S1:horizontal:adjacent": { n: 10, wrong: 1 },
        "S2:incline:opposite": { n: 6, wrong: 2 },
        "S2:incline:adjacent": { n: 6, wrong: 1 },
      },
    };
  });
}

export function demoPresence(): (PresenceDoc & { uid: string })[] {
  const now = Date.now();
  return Array.from({ length: 14 }, (_, i) => ({
    uid: `demo${i}`,
    name: String(i + 1),
    status: i < 9 ? "playing" : "done",
    stageId: "S1",
    updatedAt: ts(now - i * 1000),
  }));
}
