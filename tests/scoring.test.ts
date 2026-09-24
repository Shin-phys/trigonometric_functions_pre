import { describe, expect, it } from "vitest";
import { pointsFor, summarize } from "@/lib/scoring";

describe("スコア計算", () => {
  it("速いほど高得点（上限・下限あり）", () => {
    expect(pointsFor(300)).toBe(150);
    expect(pointsFor(1000)).toBe(125);
    expect(pointsFor(3000)).toBe(100);
  });

  it("正確さを重視：同じ正答数でも誤答が多いと大きく下がる", () => {
    const fast = (correct: boolean) => ({ statKey: "k", correct, ms: 500 });
    const a = summarize(Array(20).fill(fast(true)));
    const b = summarize([...Array(20).fill(fast(true)), ...Array(10).fill(fast(false))]);
    expect(a.score).toBe(3000);
    expect(b.score).toBeLessThan(a.score * 0.5);
  });

  it("出題パターン別の誤答数を集計する", () => {
    const s = summarize([
      { statKey: "S1:vertical:opposite", correct: false, ms: 900 },
      { statKey: "S1:vertical:opposite", correct: true, ms: 900 },
      { statKey: "S1:horizontal:adjacent", correct: true, ms: 900 },
    ]);
    expect(s.patternStats["S1:vertical:opposite"]).toEqual({ n: 2, wrong: 1 });
    expect(s.total).toBe(3);
  });
});
