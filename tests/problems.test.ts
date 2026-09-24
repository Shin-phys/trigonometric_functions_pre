import { describe, expect, it } from "vitest";
import { STAGES, getStage } from "@/config/stages";
import { generateProblem } from "@/lib/problems";
import { classifyAngle } from "@/lib/problems/generators/angle";
import { BASIC_CHOICES, componentChoices } from "@/lib/problems/choices";
import { seeded } from "@/lib/problems/rng";
import { mirror } from "@/lib/problems/geometry";
import type { Prim } from "@/lib/problems/types";

const N = 500;

describe("全ステージ共通", () => {
  for (const stage of STAGES) {
    it(`${stage.id}: 4 択・重複なし・正解が含まれる`, () => {
      const rng = seeded(1);
      for (let i = 0; i < N; i++) {
        const p = generateProblem(stage, rng);
        const ids = p.choices.map((c) => c.id);
        expect(ids).toHaveLength(4);
        expect(new Set(ids).size).toBe(4);
        expect(ids).toContain(p.correctId);
        expect(p.thetaDeg).toBeGreaterThanOrEqual(stage.thetaRange[0]);
        expect(p.thetaDeg).toBeLessThanOrEqual(stage.thetaRange[1]);
        const targets = p.figure.prims.filter((x) => "emphasis" in x && x.emphasis === "target");
        expect(targets).toHaveLength(1);
      }
    });
  }
});

describe("基本モードに tan・比率項が混入しない（v2 修正点）", () => {
  for (const stage of STAGES.filter((s) => s.mode === "basic")) {
    it(stage.id, () => {
      const rng = seeded(2);
      for (let i = 0; i < N; i++) {
        const p = generateProblem(stage, rng);
        for (const c of p.choices) {
          expect(c.tex).not.toMatch(/tan|frac/);
        }
      }
    });
  }
});

describe("成分選択の正解ロジック", () => {
  it("対辺→sin・隣辺→cos・斜辺→力そのもの", () => {
    expect(componentChoices("F", "opposite").correctId).toBe("Fsin");
    expect(componentChoices("mg", "adjacent").correctId).toBe("mgcos");
    expect(componentChoices("mg", "hypotenuse").correctId).toBe("mg");
  });

  it("ダミーは sin/cos 入替・力の名称入替・両方入替", () => {
    const { choiceIds } = componentChoices("mg", "adjacent");
    expect(choiceIds.sort()).toEqual(["Fcos", "Fsin", "mgcos", "mgsin"]);
    for (const id of choiceIds) expect(BASIC_CHOICES[id]).toBeDefined();
  });

  it("強調された矢印の長さが正解の式の値と一致する", () => {
    const rng = seeded(3);
    for (const id of ["S1", "S2", "S3"]) {
      const stage = getStage(id)!;
      for (let i = 0; i < N; i++) {
        const p = generateProblem(stage, rng);
        const arrows = p.figure.prims.filter((x): x is Extract<Prim, { kind: "arrow" }> => x.kind === "arrow");
        const target = arrows.find((a) => a.emphasis === "target")!;
        const force = arrows.find((a) => a.role === "hypotenuse")!;
        const lt = Math.hypot(target.to.x - target.from.x, target.to.y - target.from.y);
        const lf = Math.hypot(force.to.x - force.from.x, force.to.y - force.from.y);
        const th = (p.thetaDeg * Math.PI) / 180;
        const expected = p.correctId.endsWith("sin") ? Math.sin(th) : p.correctId.endsWith("cos") ? Math.cos(th) : 1;
        expect(lt / lf).toBeCloseTo(expected, 6);
      }
    }
  });
});

describe("Stage 0：角度認識", () => {
  it("θ=45° 付近は出題しない（θ と 90°−θ が区別できないため）", () => {
    const rng = seeded(4);
    const stage = getStage("S0")!;
    for (let i = 0; i < N; i++) {
      expect(Math.abs(generateProblem(stage, rng).thetaDeg - 45)).toBeGreaterThanOrEqual(8);
    }
  });

  it("強調された角の実測値が正解の選択肢と一致する", () => {
    const rng = seeded(5);
    const stage = getStage("S0")!;
    for (let i = 0; i < N; i++) {
      const p = generateProblem(stage, rng);
      const arc = p.figure.prims.find((x) => x.kind === "arc" && x.emphasis === "target") as Extract<Prim, { kind: "arc" }>;
      const measured = arc.endDeg - arc.startDeg;
      expect(classifyAngle(measured, p.thetaDeg)).toBe(p.correctId);
    }
  });

  it("θ と等しい角の出題がおおむね半分", () => {
    const rng = seeded(6);
    const stage = getStage("S0")!;
    let n = 0;
    for (let i = 0; i < 2000; i++) if (generateProblem(stage, rng).correctId === "theta") n++;
    expect(n / 2000).toBeGreaterThan(0.4);
    expect(n / 2000).toBeLessThan(0.6);
  });
});

describe("発展モード", () => {
  it("水平な力→mg tanθ、斜めの力→mg/cosθ", () => {
    const rng = seeded(7);
    const stage = getStage("A1")!;
    for (let i = 0; i < N; i++) {
      const p = generateProblem(stage, rng);
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
