/**
 * 選択肢の定義（仕様書 4-③、v3 で 2 択・並び固定に変更）。
 * 並びは固定：左 sin・右 cos（ボタンの縁も 対辺＝赤／隣辺＝青 に合わせる）。
 * 1 つの問題の中で F と mg を混ぜない。tan を含む比率項は発展モードだけ。
 */
import type { Choice, Role } from "./types";

export type ForceSym = "F" | "mg";

/** 成分選択（Stage 1〜3）の 2 択。左 sin・右 cos で固定 */
export function componentChoices(force: ForceSym, role: Exclude<Role, "hypotenuse">): { correctId: string; choices: Choice[] } {
  return {
    correctId: `${force}${role === "opposite" ? "sin" : "cos"}`,
    choices: [
      { id: `${force}sin`, tex: `${force}\\sin\\theta`, tone: "sin" },
      { id: `${force}cos`, tex: `${force}\\cos\\theta`, tone: "cos" },
    ],
  };
}

/** 発展モード（tan との使い分け）の 2 択。左 tan・右 1/cos で固定 */
export const TAN_CHOICES: Choice[] = [
  { id: "mgtan", tex: "mg\\tan\\theta" },
  { id: "mg/cos", tex: "\\dfrac{mg}{\\cos\\theta}" },
];
