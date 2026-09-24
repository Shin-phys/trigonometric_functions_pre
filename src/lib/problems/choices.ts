/**
 * 選択肢の定義とダミー生成ルール（仕様書 4-③）。
 * 基本モードは直交成分のみ（F, Fsinθ, Fcosθ, mg, mgsinθ, mgcosθ）。
 * tan を含む比率項は発展モード（TAN_CHOICES）にだけ存在する。
 */
import type { Choice, Role } from "./types";

export type ForceSym = "F" | "mg";

/** 基本モードの選択肢（直交成分のみ） */
export const BASIC_CHOICES: Record<string, Choice> = {
  F: { id: "F", tex: "F" },
  Fsin: { id: "Fsin", tex: "F\\sin\\theta" },
  Fcos: { id: "Fcos", tex: "F\\cos\\theta" },
  mg: { id: "mg", tex: "mg" },
  mgsin: { id: "mgsin", tex: "mg\\sin\\theta" },
  mgcos: { id: "mgcos", tex: "mg\\cos\\theta" },
};

const other = (f: ForceSym): ForceSym => (f === "F" ? "mg" : "F");

/**
 * 成分選択問題の 4 択を作る。
 *   対辺/隣辺が正解 X·t(θ) のとき：
 *     ダミー1 X·t'(θ)（sin/cos の混同）
 *     ダミー2 X'·t(θ)（力の名称の混同）
 *     ダミー3 X'·t'(θ)（両方の取り違え）
 *   斜辺が正解 X のとき：X', X·sinθ, X·cosθ
 */
export function componentChoices(force: ForceSym, role: Role): { correctId: string; choiceIds: string[] } {
  const o = other(force);
  if (role === "hypotenuse") {
    return { correctId: force, choiceIds: [force, o, `${force}sin`, `${force}cos`] };
  }
  const t = role === "opposite" ? "sin" : "cos";
  const t2 = t === "sin" ? "cos" : "sin";
  return {
    correctId: `${force}${t}`,
    choiceIds: [`${force}${t}`, `${force}${t2}`, `${o}${t}`, `${o}${t2}`],
  };
}

/** Stage 0（角度認識）の選択肢。並びは固定（位置で反射できるように） */
export const ANGLE_CHOICES: Choice[] = [
  { id: "theta", tex: "\\theta" },
  { id: "90-theta", tex: "90^\\circ-\\theta" },
  { id: "90+theta", tex: "90^\\circ+\\theta" },
  { id: "180-theta", tex: "180^\\circ-\\theta" },
];

/** 発展モード（tan との使い分け）の選択肢 */
export const TAN_CHOICES: Record<string, Choice> = {
  mgtan: { id: "mgtan", tex: "mg\\tan\\theta" },
  "mg/cos": { id: "mg/cos", tex: "\\dfrac{mg}{\\cos\\theta}" },
  mgsin: { id: "mgsin", tex: "mg\\sin\\theta" },
  mgcos: { id: "mgcos", tex: "mg\\cos\\theta" },
  "mg/tan": { id: "mg/tan", tex: "\\dfrac{mg}{\\tan\\theta}" },
  "mg/sin": { id: "mg/sin", tex: "\\dfrac{mg}{\\sin\\theta}" },
};
