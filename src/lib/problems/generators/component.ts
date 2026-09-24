/**
 * Stage 1〜3：成分選択（仕様書 4-①②③）
 * 分解図のベクトル 1 本（成分 or 元の力）を強調し、その大きさを 4 択で選ばせる。
 *   対辺 → sin ／ 隣辺 → cos ／ 斜辺 → F・mg
 */
import type { StageConfig } from "@/config/stages";
import { BASIC_CHOICES, componentChoices, type ForceSym } from "../choices";
import { mirror } from "../geometry";
import { pick, pickTheta, pickWeighted, shuffle, type Rng } from "../rng";
import { inclineScene, planeScene, setElement, toPrims, type Scene } from "../scenes";
import type { Pattern, Problem, Role } from "../types";

/** 役割 → シーン内の要素名 */
const TARGET_ELEMENT: Record<"plane" | "incline", Record<Role, string>> = {
  plane: { opposite: "compOther", adjacent: "compRef", hypotenuse: "vector" },
  incline: { opposite: "compPar", adjacent: "compPerp", hypotenuse: "vector" },
};

export function generateComponentProblem(stage: StageConfig, rng: Rng): Problem {
  const pattern = pick(rng, stage.patterns) as Pattern;
  const theta = pickTheta(rng, stage.thetaRange, 3);
  const role = pickWeighted(rng, stage.roleWeights ?? { opposite: 1, adjacent: 1, hypotenuse: 0.5 });

  let scene: Scene;
  let force: ForceSym;
  let kind: "plane" | "incline";
  if (pattern === "incline") {
    scene = inclineScene(theta, { showDerivedAngle: stage.showDerivedAngle ?? true });
    force = "mg";
    kind = "incline";
  } else if (pattern === "horizontal" || pattern === "vertical") {
    scene = planeScene(pattern, theta);
    force = "F";
    kind = "plane";
  } else {
    throw new Error(`component generator does not support pattern: ${pattern}`);
  }

  setElement(scene, TARGET_ELEMENT[kind][role], { emphasis: "target" });

  const flipX = rng() < 0.5;
  const flipY = kind === "plane" && rng() < 0.5;
  const figure = mirror({ prims: toPrims(scene) }, flipX, flipY);

  const { correctId, choiceIds } = componentChoices(force, role);
  const ids = stage.shuffleChoices ? shuffle(rng, choiceIds) : choiceIds;

  return {
    stageId: stage.id,
    pattern,
    statKey: `${stage.id}:${pattern}:${role}`,
    thetaDeg: theta,
    figure,
    prompt: "光っているベクトルの大きさは？",
    choices: ids.map((id) => BASIC_CHOICES[id]),
    correctId,
  };
}
