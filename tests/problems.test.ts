import { describe, expect, it } from "vitest";
import { STAGES, getStage, goalOf } from "@/config/stages";
import { buildDeck, createProblemSource, generateFromSlot } from "@/lib/problems";
import { seeded } from "@/lib/problems/rng";
import { mirror } from "@/lib/problems/geometry";
import type { Prim } from "@/lib/problems/types";

const N = 500;

describe("山札（ステージ構成）", () => {
  for (const stage of STAGES) {
    it(`${stage.id}: 1 組の枚数がゴールの正解数と一致し、答えが半々`, () => {
      const deck = buildDeck(stage, seeded(1));
      expect(deck).toHaveLength(goalOf(stage));
      const answers = new Set(deck.map((d) => d.answer));
      expect(answers.size).toBe(2);
      for (const a of answers) expect(deck.filter((d) => d.answer === a)).toHaveLength(goalOf(stage) / 2);
    });

    it(`${stage.id}: 山札のどの札からも問題を作れる`, () => {
      const rng = seeded(2);
      for (const d of stage.deck) {
        for (let i = 0; i < 100; i++) generateFromSlot(stage, { pattern: d.pattern, answer: d.answer }, rng);
      }
    });

    it(`${stage.id}: 最初の 1 組は山札どおりの構成になる`, () => {
      const src = createProblemSource(stage, seeded(3));
      const keys = Array.from({ length: goalOf(stage) }, () => src.next().statKey);
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

describe("斜面の図", () => {
  it("θ は斜面の底角だけに表示し、力の分解側には描かない", () => {
    for (const id of ["S2", "S3"]) {
      const src = createProblemSource(getStage(id)!, seeded(12));
      for (let i = 0; i < 200; i++) {
        const p = src.next();
        if (p.pattern !== "incline") continue;
        const thetaArcs = p.figure.prims.filter((x) => x.kind === "arc" && x.label === "θ");
        expect(thetaArcs).toHaveLength(1);
      }
    }
  });
});

describe("ステージ構成", () => {
  it("Stage 0（角度認識）は廃止済み", () => {
    expect(getStage("S0")).toBeUndefined();
    expect(STAGES.map((s) => s.id)).toEqual(["S1", "S2", "S3", "A1"]);
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
