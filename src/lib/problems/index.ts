/**
 * 問題生成の入口。
 * 山札（config/stages.ts の deck）をシャッフルして 1 枚ずつ引き、generator で図と選択肢を作る。
 * 山札を使い切ったら（誤答で 12 問を超えたとき）同じ構成の山札を新しく切る。
 */
import type { StageConfig } from "@/config/stages";
import { generateAngleProblem } from "./generators/angle";
import { generateComponentProblem } from "./generators/component";
import { generateTanProblem } from "./generators/tan";
import { defaultRng, shuffle, type Rng } from "./rng";
import type { Problem, Slot } from "./types";

const GENERATORS = {
  angle: generateAngleProblem,
  component: generateComponentProblem,
  tan: generateTanProblem,
} as const;

/** 山札 1 組（シャッフル済み） */
export function buildDeck(stage: StageConfig, rng: Rng = defaultRng): Slot[] {
  const slots = stage.deck.flatMap((d) => Array.from({ length: d.count }, () => ({ pattern: d.pattern, answer: d.answer })));
  // 同じ種類の札が 3 枚以上続かないよう、数回まで切り直す
  let best = shuffle(rng, slots);
  for (let i = 0; i < 20 && maxRun(best) > 2; i++) best = shuffle(rng, slots);
  return best;
}

function maxRun(slots: Slot[]): number {
  let run = 1;
  let max = 1;
  for (let i = 1; i < slots.length; i++) {
    run = slots[i].answer === slots[i - 1].answer ? run + 1 : 1;
    max = Math.max(max, run);
  }
  return max;
}

export function generateFromSlot(stage: StageConfig, slot: Slot, rng: Rng = defaultRng): Problem {
  return GENERATORS[stage.generator](stage, slot, rng);
}

/** 1 ラウンド分の出題器。next() を呼ぶたびに山札から 1 問作る */
export function createProblemSource(stage: StageConfig, rng: Rng = defaultRng): { next: () => Problem } {
  let deck: Slot[] = [];
  let prev: Problem | undefined;
  return {
    next() {
      if (!deck.length) deck = buildDeck(stage, rng);
      const slot = deck.shift()!;
      // 直前と同じ θ・同じ図にならないようにする
      let p = generateFromSlot(stage, slot, rng);
      for (let i = 0; i < 5 && prev && p.statKey === prev.statKey && p.thetaDeg === prev.thetaDeg; i++) {
        p = generateFromSlot(stage, slot, rng);
      }
      prev = p;
      return p;
    },
  };
}

export type { Problem } from "./types";
