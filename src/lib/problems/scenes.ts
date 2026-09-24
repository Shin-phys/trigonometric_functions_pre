/**
 * 図の「舞台」を組み立てる。
 * 各シーンは正規の向き（右上がり・第1象限など）で作り、ランダムな反転は generator 側で mirror() する。
 * 要素は名前付きで返すので、generator は名前を指定して強調（emphasis）や役割（role）を付け替えるだけでよい。
 */
import { add, dir, minorArc, mul, v } from "./geometry";
import type { Prim, Vec } from "./types";

export type Scene = {
  /** 描画順に並んだ名前付き要素 */
  elements: [string, Prim][];
  /** 角度問題などで使う点と方向 */
  anchors: Record<string, Vec>;
};

export function toPrims(scene: Scene): Prim[] {
  return scene.elements.map(([, p]) => p);
}

export function setElement(scene: Scene, name: string, patch: Partial<Prim>): void {
  const item = scene.elements.find(([n]) => n === name);
  if (!item) throw new Error(`scene element not found: ${name}`);
  item[1] = { ...item[1], ...patch } as Prim;
}

const circle = (c: Vec, r: number, n = 28): Vec[] =>
  Array.from({ length: n }, (_, i) => add(c, mul(dir((360 / n) * i), r)));

/* ------------------------------------------------------------------ */
/* 平面パターン（水平・鉛直）                                          */
/* ------------------------------------------------------------------ */

/**
 * 原点 O から力 F を描き、2軸に分解する。
 *   horizontal: 基準軸＝水平（0°）。F は水平から θ
 *   vertical  : 基準軸＝鉛直（90°）。F は鉛直から θ
 * 基準軸方向の成分＝隣辺（cos）、もう一方＝対辺（sin）
 */
export function planeScene(pattern: "horizontal" | "vertical", theta: number, L = 100): Scene {
  const refDeg = pattern === "horizontal" ? 0 : 90;
  const otherDeg = pattern === "horizontal" ? 90 : 0;
  const vecDeg = pattern === "horizontal" ? theta : 90 - theta;

  const O = v(0, 0);
  const P = mul(dir(vecDeg), L);
  const ref = mul(dir(refDeg), L * Math.cos((theta * Math.PI) / 180)); // 隣辺の先端
  const oth = mul(dir(otherDeg), L * Math.sin((theta * Math.PI) / 180)); // 対辺の先端
  const ext = 0.3 * L;

  const arc = minorArc(refDeg, vecDeg);
  const elements: [string, Prim][] = [
    ["axisRef", { kind: "line", a: mul(dir(refDeg), -ext), b: mul(dir(refDeg), L + ext * 0.6), style: "guide" }],
    ["axisOther", { kind: "line", a: mul(dir(otherDeg), -ext), b: mul(dir(otherDeg), L + ext * 0.6), style: "guide" }],
    ["dashToRef", { kind: "line", a: P, b: ref, style: "dashed", role: "opposite" }],
    ["dashToOther", { kind: "line", a: P, b: oth, style: "dashed", role: "adjacent" }],
    ["rightAngle", { kind: "rightAngle", at: ref, dir1Deg: refDeg + 180, dir2Deg: otherDeg, size: 8 }],
    ["compRef", { kind: "arrow", from: O, to: ref, emphasis: "normal", role: "adjacent" }],
    ["compOther", { kind: "arrow", from: O, to: oth, emphasis: "normal", role: "opposite" }],
    ["vector", { kind: "arrow", from: O, to: P, emphasis: "normal", role: "hypotenuse", label: "F" }],
    ["thetaGiven", { kind: "arc", center: O, ...arc, radius: 24, label: "θ", emphasis: "given" }],
  ];
  return { elements, anchors: { O, P, ref, oth, refDir: dir(refDeg), otherDir: dir(otherDeg), vecDir: dir(vecDeg) } };
}

/* ------------------------------------------------------------------ */
/* 斜面パターン（重力の分解）                                          */
/* ------------------------------------------------------------------ */

/**
 * 右上がりで傾き θ の斜面上の物体。重力 mg を斜面方向と斜面垂直方向に分解する。
 *   斜面垂直方向の成分＝隣辺（mgcosθ）、斜面方向の成分＝対辺（mgsinθ）
 */
export function inclineScene(theta: number, opts: { showDerivedAngle: boolean; L?: number }): Scene {
  const L = opts.L ?? 100;
  const S = 190;
  const A = v(0, 0);
  const T = mul(dir(theta), S);
  const C = v(T.x, 0);
  const h = 13;
  const Q = mul(dir(theta), S * 0.5); // 物体の接地点
  const G = add(Q, mul(dir(theta + 90), h)); // 物体の中心
  const block = [add(Q, mul(dir(theta), -h)), add(Q, mul(dir(theta), h))];
  const blockPoly = [block[0], block[1], add(block[1], mul(dir(theta + 90), 2 * h)), add(block[0], mul(dir(theta + 90), 2 * h))];

  const s = Math.sin((theta * Math.PI) / 180);
  const c = Math.cos((theta * Math.PI) / 180);
  const M = add(G, v(0, -L)); // mg の先端
  const par = add(G, mul(dir(theta + 180), L * s)); // 斜面方向成分の先端（対辺）
  const perp = add(G, mul(dir(theta - 90), L * c)); // 斜面垂直成分の先端（隣辺）

  const elements: [string, Prim][] = [
    ["ground", { kind: "polygon", points: [A, C, T], style: "ground" }],
    ["floor", { kind: "line", a: v(-20, 0), b: v(C.x + 20, 0), style: "solid" }],
    ["baseRight", { kind: "rightAngle", at: C, dir1Deg: 180, dir2Deg: 90, size: 9 }],
    ["block", { kind: "polygon", points: blockPoly, style: "block" }],
    ["dashToPar", { kind: "line", a: M, b: par, style: "dashed", role: "adjacent" }],
    ["dashToPerp", { kind: "line", a: M, b: perp, style: "dashed", role: "opposite" }],
    ["compPerp", { kind: "arrow", from: G, to: perp, emphasis: "normal", role: "adjacent" }],
    ["compPar", { kind: "arrow", from: G, to: par, emphasis: "normal", role: "opposite" }],
    ["vector", { kind: "arrow", from: G, to: M, emphasis: "normal", role: "hypotenuse", label: "mg" }],
    ["thetaGiven", { kind: "arc", center: A, startDeg: 0, endDeg: theta, radius: 34, label: "θ", emphasis: "given" }],
  ];
  if (opts.showDerivedAngle) {
    elements.push([
      "thetaDerived",
      { kind: "arc", center: G, startDeg: 270, endDeg: 270 + theta, radius: 26, label: "θ", emphasis: "given" },
    ]);
  }
  return { elements, anchors: { A, C, T, G, M, par, perp } };
}

/* ------------------------------------------------------------------ */
/* 発展：つり合いの 3 力（tan との使い分け）                           */
/* ------------------------------------------------------------------ */

/**
 * 天井からひもでつるしたおもりを、水平な力 F で引いて静止させる。
 *   ひもは鉛直から θ。T = mg/cosθ、F = mg tanθ
 */
export function hangScene(theta: number, L = 72): Scene {
  const K = v(0, 0);
  const Ls = 190;
  const G = mul(dir(270 + theta), Ls);
  const r = 11;
  const t = Math.tan((theta * Math.PI) / 180);
  const cs = Math.cos((theta * Math.PI) / 180);
  const M = add(G, v(0, -L));
  const Ftip = add(G, v(L * t, 0));
  const Ttip = add(G, mul(dir(90 + theta), L / cs));
  const tri = add(M, v(L * t, 0));

  const elements: [string, Prim][] = [
    ["ceiling", { kind: "line", a: v(-70, 0), b: v(90, 0), style: "solid" }],
    ["ceilingHatch", { kind: "hatch", a: v(-70, 0), b: v(90, 0), side: 1 }],
    ["vertical", { kind: "line", a: K, b: v(0, -Ls * 0.8), style: "guide" }],
    ["string", { kind: "line", a: K, b: add(G, mul(dir(90 + theta), r)), style: "solid" }],
    ["ball", { kind: "polygon", points: circle(G, r), style: "ball" }],
    ["thetaGiven", { kind: "arc", center: K, startDeg: 270, endDeg: 270 + theta, radius: 40, label: "θ", emphasis: "given" }],
    // 誤答時だけ見せる「力の三角形」
    ["triH", { kind: "line", a: M, b: tri, style: "dashed", role: "opposite", feedbackOnly: true }],
    ["triHyp", { kind: "line", a: G, b: tri, style: "dashed", role: "hypotenuse", feedbackOnly: true }],
    ["triTheta", { kind: "arc", center: G, startDeg: 270, endDeg: 270 + theta, radius: 22, label: "θ", emphasis: "given", feedbackOnly: true }],
    ["mg", { kind: "arrow", from: G, to: M, emphasis: "normal", role: "adjacent", label: "mg" }],
    ["horizontal", { kind: "arrow", from: G, to: Ftip, emphasis: "normal", role: "opposite", label: "F" }],
    ["oblique", { kind: "arrow", from: G, to: Ttip, emphasis: "normal", role: "hypotenuse", label: "T" }],
  ];
  return { elements, anchors: { K, G } };
}

/**
 * なめらかな斜面（傾き θ）上の物体を、水平な力 F で押して静止させる。
 *   垂直抗力 N = mg/cosθ、F = mg tanθ
 */
export function pushScene(theta: number, L = 70): Scene {
  const S = 210;
  const A = v(0, 0);
  const T = mul(dir(theta), S);
  const C = v(T.x, 0);
  const h = 13;
  const Q = mul(dir(theta), S * 0.45);
  const G = add(Q, mul(dir(theta + 90), h));
  const block = [add(Q, mul(dir(theta), -h)), add(Q, mul(dir(theta), h))];
  const blockPoly = [block[0], block[1], add(block[1], mul(dir(theta + 90), 2 * h)), add(block[0], mul(dir(theta + 90), 2 * h))];
  const t = Math.tan((theta * Math.PI) / 180);
  const cs = Math.cos((theta * Math.PI) / 180);
  const M = add(G, v(0, -L));
  const Ftip = add(G, v(L * t, 0));
  const Ntip = add(G, mul(dir(90 + theta), L / cs));
  const tri = add(M, v(L * t, 0));

  const elements: [string, Prim][] = [
    ["ground", { kind: "polygon", points: [A, C, T], style: "ground" }],
    ["floor", { kind: "line", a: v(-20, 0), b: v(C.x + 20, 0), style: "solid" }],
    ["baseRight", { kind: "rightAngle", at: C, dir1Deg: 180, dir2Deg: 90, size: 9 }],
    ["block", { kind: "polygon", points: blockPoly, style: "block" }],
    ["thetaGiven", { kind: "arc", center: A, startDeg: 0, endDeg: theta, radius: 34, label: "θ", emphasis: "given" }],
    ["triH", { kind: "line", a: M, b: tri, style: "dashed", role: "opposite", feedbackOnly: true }],
    ["triHyp", { kind: "line", a: G, b: tri, style: "dashed", role: "hypotenuse", feedbackOnly: true }],
    ["triTheta", { kind: "arc", center: G, startDeg: 270, endDeg: 270 + theta, radius: 22, label: "θ", emphasis: "given", feedbackOnly: true }],
    ["mg", { kind: "arrow", from: G, to: M, emphasis: "normal", role: "adjacent", label: "mg" }],
    ["horizontal", { kind: "arrow", from: G, to: Ftip, emphasis: "normal", role: "opposite", label: "F" }],
    ["oblique", { kind: "arrow", from: G, to: Ntip, emphasis: "normal", role: "hypotenuse", label: "N" }],
  ];
  return { elements, anchors: { A, G } };
}
