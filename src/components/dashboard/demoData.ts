/** ダッシュボードの見本データ（?demo=1）。Firebase なしで表示を確認するためのもの */
import type { PresenceDoc, ResultDoc } from "@/lib/firebase/repository";
import type { Timestamp } from "firebase/firestore";

const ts = (ms: number) => ({ toMillis: () => ms }) as unknown as Timestamp;

export function demoResults(): ResultDoc[] {
  const names = ["1", "2", "3", "5", "8", "11", "13", "17", "21", "24", "ぴかりん", "たける"];
  const rows: ResultDoc[] = [];
  names.forEach((name, i) => {
    for (const [j, stageId] of ["S0", "S1", "S1", "S2"].entries()) {
      const miss = (i + j) % 4;
      const total = 12 + miss;
      rows.push({
        uid: `demo${i}`,
        name,
        stageId,
        clearMs: 11000 + i * 900 + miss * 2100 + j * 400,
        correct: 12,
        total,
        accuracy: 12 / total,
        medianMs: 650 + i * 45,
        mastered: miss === 0 && i < 7 && j > 1,
        patternStats:
          stageId === "S0"
            ? {
                "S0:incline:G-mg-normal": { n: 4, wrong: miss > 0 ? 1 : 0 },
                "S0:incline:T-top": { n: 4, wrong: miss > 2 ? 1 : 0 },
                "S0:horizontal:P-alt": { n: 4, wrong: 0 },
              }
            : {
                [`${stageId}:vertical:opposite`]: { n: 3, wrong: miss > 1 ? 1 : 0 },
                [`${stageId}:vertical:adjacent`]: { n: 3, wrong: miss > 2 ? 1 : 0 },
                [`${stageId}:horizontal:adjacent`]: { n: 3, wrong: miss > 0 ? 1 : 0 },
                [`${stageId}:horizontal:opposite`]: { n: 3, wrong: 0 },
              },
      });
    }
  });
  return rows;
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
