import { describe, expect, it } from "vitest";
import { GAME } from "@/config/game";
import { STAGES, getStage } from "@/config/stages";
import { buildDeck, createProblemSource, generateFromSlot } from "@/lib/problems";
import { classifyAngle } from "@/lib/problems/generators/angle";
import { seeded } from "@/lib/problems/rng";
import { mirror } from "@/lib/problems/geometry";
import type { Prim } from "@/lib/problems/types";

const N = 500;

describe("山札（ステージ構成）", () => {
  for (const stage of STAGES) {
    it(`${stage.id}: 1 組の枚数がゴールの正解数と一致し、答えが半々`, () => {
      const deck = buildDeck(stage, seeded(1));
      expect(deck).toHaveLength(GAME.goalCorrect);
      const answers = new Set(deck.map((d) => d.answer));
      expect(answers.size).toBe(2);
      for (const a of answers) expect(deck.filter((d) => d.answer === a)).toHaveLength(GAME.goalCorrect / 2);
    });

    it(`${stage.id}: 山札のどの札からも問題を作れる`, () => {
      const rng = seeded(2);
      for (const d of stage.deck) {
        for (let i = 0; i < 100; i++) generateFromSlot(stage, { pattern: d.pattern, answer: d.answer }, rng);
      }
    });

    it(`${stage.id}: 最初の 12 問は山札どおりの構成になる`, () => {
      const src = createProblemSource(stage, seeded(3));
      const keys = Array.from({ length: GAME.goalCorrect }, () => src.next().statKey);
      for (const d of stage.deck) {
        const n = keys.filter((k) => k.startsWith(`${stage.id}:${d.pattern}:`)).length;
        expect(n).toBeGreaterThanOrEqual(d.count);
      }
    });
  }
});

describe("全ステージ共通", () => {
  for (const stage of STAGES) {
    it(`${stage.id}: 2 択・正解を含む・強調は 1 か所・θ が範囲内`, () => {
      const src = createProblemSource(stage, seeded(4));
      for (let i = 0; i < N; i++) {
        const p = src.next();
        expect(p.choices).toHaveLength(2);
        expect(p.choices.map((c) => c.id)).toContain(p.correctId);
        expect(p.thetaDeg).toBeGreaterThanOrEqual(stage.thetaRange[0]);
        expect(p.thetaDeg).toBeLessThanOrEqual(stage.thetaRange[1]);
        expect(p.figure.prims.filter((x) => "emphasis" in x && x.emphasis === "target")).toHaveLength(1);
      }
    });
  }
});

describe("基本モード（v3）", () => {
  it("tan・比率項が混入しない／F と mg を同じ問題に混ぜない／左 sin・右 cos 固定", () => {
    for (const id of ["S1", "S2", "S3"]) {
      const src = createProblemSource(getStage(id)!, seeded(5));
      for (let i = 0; i < N; i++) {
        const p = src.next();
        for (const c of p.choices) expect(c.tex).not.toMatch(/tan|frac/);
        const force = p.pattern === "incline" ? "mg" : "F";
        expect(p.choices.map((c) => c.id)).toEqual([`${force}sin`, `${force}cos`]);
        expect(p.choices.map((c) => c.tone)).toEqual(["sin", "cos"]);
      }
    }
  });

  it("強調された矢印の長さ比が正解の式（sin/cos）と一致する", () => {
    for (const id of ["S1", "S2", "S3"]) {
      const src = createProblemSource(getStage(id)!, seeded(6));
      for (let i = 0; i < N; i++) {
        const p = src.next();
        const arrows = p.figure.prims.filter((x): x is Extract<Prim, { kind: "arrow" }> => x.kind === "arrow");
        const target = arrows.find((a) => a.emphasis === "target")!;
        const force = arrows.find((a) => a.role === "hypotenuse")!;
        const lt = Math.hypot(target.to.x - target.from.x, target.to.y - target.from.y);
        const lf = Math.hypot(force.to.x - force.from.x, force.to.y - force.from.y);
        const th = (p.thetaDeg * Math.PI) / 180;
        expect(lt / lf).toBeCloseTo(p.correctId.endsWith("sin") ? Math.sin(th) : Math.cos(th), 6);
      }
    }
  });
});

describe("Stage 0：角度認識", () => {
  const stage = getStage("S0")!;

  it("選択肢は θ と 90°−θ の 2 つだけ", () => {
    const src = createProblemSource(stage, seeded(7));
    for (let i = 0; i < 50; i++) expect(src.next().choices.map((c) => c.id)).toEqual(["theta", "90-theta"]);
  });

  it("θ=45° 付近は出題しない", () => {
    const src = createProblemSource(stage, seeded(8));
    for (let i = 0; i < N; i++) expect(Math.abs(src.next().thetaDeg - 45)).toBeGreaterThanOrEqual(8);
  });

  it("強調された角の実測値が正解と一致する", () => {
    const src = createProblemSource(stage, seeded(9));
    for (let i = 0; i < N; i++) {
      const p = src.next();
      const arc = p.figure.prims.find((x) => x.kind === "arc" && x.emphasis === "target") as Extract<Prim, { kind: "arc" }>;
      expect(classifyAngle(arc.endDeg - arc.startDeg, p.thetaDeg)).toBe(p.correctId);
    }
  });
});

describe("発展モード", () => {
  it("水平な力→mg tanθ、斜めの力→mg/cosθ", () => {
    const src = createProblemSource(getStage("A1")!, seeded(10));
    for (let i = 0; i < N; i++) {
      const p = src.next();
      expect(p.statKey.endsWith("horizontal") ? "mgtan" : "mg/cos").toBe(p.correctId);
    }
  });
});

describe("鏡像", () => {
  it("反転しても弧の開き角は変わらない", () => {
    const fig = { prims: [{ kind: "arc", center: { x: 0, y: 0 }, startDeg: 10, endDeg: 40, radius: 10, emphasis: "given" } as Prim] };
    for (const [fx, fy] of [[true, false], [false, true], [true, true]] as const) {
      const a = mirror(fig, fx, fy).prims[0] as Extract<Prim, { kind: "arc" }>;
      expect(a.endDeg - a.startDeg).toBeCloseTo(30);
    }
  });
});
