/**
 * Stage 1〜3：成分選択（仕様書 4-①②③）
 * 分解図の成分ベクトル 1 本を強調し、その大きさを 2 択（sin / cos）で選ばせる。
 *   対辺 → sin ／ 隣辺 → cos
 */
import type { StageConfig } from "@/config/stages";
import { componentChoices, type ForceSym } from "../choices";
import { mirror } from "../geometry";
import { pickTheta, type Rng } from "../rng";
import { inclineScene, planeScene, setElement, toPrims, type Scene } from "../scenes";
import type { Problem, Slot } from "../types";

type ComponentRole = "opposite" | "adjacent";

/** 役割 → シーン内の要素名 */
const TARGET_ELEMENT: Record<"plane" | "incline", Record<ComponentRole, string>> = {
  plane: { opposite: "compOther", adjacent: "compRef" },
  incline: { opposite: "compPar", adjacent: "compPerp" },
};

export function generateComponentProblem(stage: StageConfig, slot: Slot, rng: Rng): Problem {
  const { pattern } = slot;
  const role = slot.answer as ComponentRole;
  if (role !== "opposite" && role !== "adjacent") throw new Error(`invalid component answer: ${slot.answer}`);
  const theta = pickTheta(rng, stage.thetaRange, 3);

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
  const { correctId, choices } = componentChoices(force, role);

  return {
    stageId: stage.id,
    pattern,
    statKey: `${stage.id}:${pattern}:${role}`,
    thetaDeg: theta,
    figure,
    prompt: "光っている成分の大きさは？",
    choices,
    correctId,
  };
}
