import { describe, expect, it } from "vitest";
import { MASTERY } from "@/config/game";
import { judgeMastery, median, summarize } from "@/lib/scoring";

describe("集計", () => {
  it("正答率・中央値（正解のみ）・パターン別誤答", () => {
    const s = summarize(
      [
        { statKey: "S1:vertical:opposite", correct: false, ms: 300 },
        { statKey: "S1:vertical:opposite", correct: true, ms: 900 },
        { statKey: "S1:horizontal:adjacent", correct: true, ms: 700 },
        { statKey: "S1:horizontal:adjacent", correct: true, ms: 1100 },
      ],
      15000,
    );
    expect(s.clearMs).toBe(15000);
    expect(s.accuracy).toBe(0.75);
    expect(s.medianMs).toBe(900);
    expect(s.patternStats["S1:vertical:opposite"]).toEqual({ n: 2, wrong: 1 });
  });

  it("中央値は外れ値に引っぱられない", () => {
    expect(median([600, 700, 800, 9000])).toBe(750);
  });
});

describe("到達判定", () => {
  const good = { correct: 12, total: 12, rts: Array(12).fill(800) };

  it("規定回数そろって両条件を満たすと到達", () => {
    const r = judgeMastery(Array(MASTERY.windowSessions).fill(good));
    expect(r.mastered).toBe(true);
  });

  it("回数が足りなければ未到達", () => {
    expect(judgeMastery([good]).mastered).toBe(false);
  });

  it("速くても正答率が低ければ未到達（適当押し対策）", () => {
    const sloppy = { correct: 12, total: 18, rts: Array(12).fill(400) };
    const r = judgeMastery(Array(MASTERY.windowSessions).fill(sloppy));
    expect(r.speedOk).toBe(true);
    expect(r.accuracyOk).toBe(false);
    expect(r.mastered).toBe(false);
  });

  it("正確でも遅ければ未到達", () => {
    const slow = { correct: 12, total: 12, rts: Array(12).fill(1800) };
    expect(judgeMastery(Array(MASTERY.windowSessions).fill(slow)).mastered).toBe(false);
  });

  it("直近の回だけで判定する", () => {
    const bad = { correct: 12, total: 24, rts: Array(12).fill(2000) };
    expect(judgeMastery([bad, bad, ...Array(MASTERY.windowSessions).fill(good)]).mastered).toBe(true);
  });
});
