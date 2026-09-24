/** 問題生成の入口。ステージ設定の generator 名で振り分ける。 */
import type { StageConfig } from "@/config/stages";
import { generateAngleProblem } from "./generators/angle";
import { generateComponentProblem } from "./generators/component";
import { generateTanProblem } from "./generators/tan";
import { defaultRng, type Rng } from "./rng";
import type { Problem } from "./types";

const GENERATORS = {
  angle: generateAngleProblem,
  component: generateComponentProblem,
  tan: generateTanProblem,
} as const;

export function generateProblem(stage: StageConfig, rng: Rng = defaultRng, prev?: Problem): Problem {
  // 直前と同じ出題（同じ図形・同じ強調・同じ正解）が続かないようにする
  for (let i = 0; i < 5; i++) {
    const p = GENERATORS[stage.generator](stage, rng);
    if (!prev || p.statKey !== prev.statKey || p.thetaDeg !== prev.thetaDeg) return p;
  }
  return GENERATORS[stage.generator](stage, rng);
}

export type { Problem } from "./types";
