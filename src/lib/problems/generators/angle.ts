/**
 * Stage 0：角度認識（仕様書 4-①-0）
 * 分解図の中の角を 1 つ強調し、その大きさが θ / 90°−θ / 90°+θ / 180°−θ のどれかを選ばせる。
 * 候補の角は下の CANDIDATES に「頂点と 2 方向」で定義し、値は数値計算で判定する
 * （候補を追加しても正解を手書きする必要がない）。
 */
import type { StageConfig } from "@/config/stages";
import { ANGLE_CHOICES } from "../choices";
import { add, angleBetween, dir, minorArc, mirror, mul } from "../geometry";
import { pick, pickTheta, type Rng } from "../rng";
import { inclineScene, planeScene, toPrims, type Scene } from "../scenes";
import type { Pattern, Prim, Problem, Vec } from "../types";

type Candidate = {
  id: string;
  vertex: (s: Scene) => Vec;
  /** なす角をつくる 2 方向（度）。θ の関数 */
  dirs: (theta: number) => [number, number];
  /** この角を見せるために追加する補助線の方向（度） */
  guides?: (theta: number) => number[];
};

const PLANE_CANDIDATES = (pattern: "horizontal" | "vertical"): Candidate[] => {
  const ref = pattern === "horizontal" ? 0 : 90;
  const oth = pattern === "horizontal" ? 90 : 0;
  const vec = (t: number) => (pattern === "horizontal" ? t : 90 - t);
  return [
    { id: "O-vec-other", vertex: (s) => s.anchors.O, dirs: (t) => [vec(t), oth] },
    { id: "O-vec-negref", vertex: (s) => s.anchors.O, dirs: (t) => [vec(t), ref + 180] },
    { id: "O-vec-negother", vertex: (s) => s.anchors.O, dirs: (t) => [vec(t), oth + 180] },
    { id: "P-alt", vertex: (s) => s.anchors.P, dirs: (t) => [vec(t) + 180, ref + 180] },
    { id: "P-other", vertex: (s) => s.anchors.P, dirs: (t) => [vec(t) + 180, oth + 180] },
  ];
};

/** 斜面は右上がり（底角 θ）が正規の向き。G は物体の中心 */
const INCLINE_CANDIDATES: Candidate[] = [
  { id: "G-mg-normal", vertex: (s) => s.anchors.G, dirs: (t) => [270, t - 90] },
  { id: "G-mg-slope", vertex: (s) => s.anchors.G, dirs: (t) => [270, t + 180] },
  { id: "G-up-normalout", vertex: (s) => s.anchors.G, dirs: (t) => [90, t + 90], guides: (t) => [90, t + 90] },
  { id: "G-horiz-slopedown", vertex: (s) => s.anchors.G, dirs: (t) => [180, 180 + t], guides: () => [180] },
  { id: "G-upslope-up", vertex: (s) => s.anchors.G, dirs: (t) => [t, 90], guides: (t) => [t, 90] },
  { id: "G-mg-upslope", vertex: (s) => s.anchors.G, dirs: (t) => [270, t], guides: (t) => [t] },
  { id: "G-horiz-normalout", vertex: (s) => s.anchors.G, dirs: (t) => [180, t + 90], guides: (t) => [180, t + 90] },
  { id: "G-horizR-slopedown", vertex: (s) => s.anchors.G, dirs: (t) => [0, 180 + t], guides: () => [0] },
  { id: "T-top", vertex: (s) => s.anchors.T, dirs: (t) => [180 + t, 270] },
];

/** 角の大きさ（度）を選択肢 id に分類する */
export function classifyAngle(value: number, theta: number): string | null {
  const table: [string, number][] = [
    ["theta", theta],
    ["90-theta", 90 - theta],
    ["90+theta", 90 + theta],
    ["180-theta", 180 - theta],
  ];
  const hit = table.filter(([, x]) => Math.abs(x - value) < 0.5);
  return hit.length === 1 ? hit[0][0] : null; // 2 つ以上当てはまる（θ=45° など）なら使わない
}

export function generateAngleProblem(stage: StageConfig, rng: Rng): Problem {
  const pattern = pick(rng, stage.patterns) as Pattern;
  // θ と 90°−θ の見分けがつくよう 45° 付近は除外
  const theta = pickTheta(rng, stage.thetaRange, 8);

  let scene: Scene;
  let candidates: Candidate[];
  if (pattern === "incline") {
    scene = inclineScene(theta, { showDerivedAngle: false });
    candidates = INCLINE_CANDIDATES;
  } else if (pattern === "horizontal" || pattern === "vertical") {
    scene = planeScene(pattern, theta);
    candidates = PLANE_CANDIDATES(pattern);
  } else {
    throw new Error(`angle generator does not support pattern: ${pattern}`);
  }

  const evaluated = candidates
    .map((c) => {
      const [d1, d2] = c.dirs(theta);
      return { c, d1, d2, answer: classifyAngle(angleBetween(d1, d2), theta) };
    })
    .filter((e) => e.answer !== null);

  const wantTheta = rng() < (stage.thetaEqualRatio ?? 0.5);
  const pool = evaluated.filter((e) => (e.answer === "theta") === wantTheta);
  const chosen = pick(rng, pool.length ? pool : evaluated);

  const vertex = chosen.c.vertex(scene);
  const guides: Prim[] = (chosen.c.guides?.(theta) ?? []).map((d) => ({
    kind: "line",
    a: vertex,
    b: add(vertex, mul(dir(d), 62)),
    style: "guide",
  }));
  const target: Prim = {
    kind: "arc",
    center: vertex,
    ...minorArc(chosen.d1, chosen.d2),
    radius: 20,
    label: "?",
    emphasis: "target",
  };

  const prims = [...guides, ...toPrims(scene), target];
  const flipX = rng() < 0.5;
  const flipY = pattern !== "incline" && rng() < 0.5;
  const figure = mirror({ prims }, flipX, flipY);

  return {
    stageId: stage.id,
    pattern,
    statKey: `${stage.id}:${pattern}:${chosen.c.id}`,
    thetaDeg: theta,
    figure,
    prompt: "光っている角の大きさは？",
    choices: ANGLE_CHOICES,
    correctId: chosen.answer!,
  };
}
