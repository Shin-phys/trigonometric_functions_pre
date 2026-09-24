/**
 * 発展モード：tan との使い分け（仕様書 5節【発展モード】）
 * 3 力のつり合いで、水平な力（mg tanθ）と斜めの力（mg/cosθ）を選ばせる。
 * 非直交・比率項はこのモードにだけ登場する。
 */
import type { StageConfig } from "@/config/stages";
import { TAN_CHOICES } from "../choices";
import { mirror } from "../geometry";
import { pick, pickTheta, shuffle, type Rng } from "../rng";
import { hangScene, pushScene, setElement, toPrims } from "../scenes";
import type { Pattern, Problem } from "../types";

const DISTRACTORS = ["mgsin", "mgcos", "mg/tan", "mg/sin"];

export function generateTanProblem(stage: StageConfig, rng: Rng): Problem {
  const pattern = pick(rng, stage.patterns) as Pattern;
  const theta = pickTheta(rng, stage.thetaRange, 0);
  const scene = pattern === "hang" ? hangScene(theta) : pattern === "push" ? pushScene(theta) : null;
  if (!scene) throw new Error(`tan generator does not support pattern: ${pattern}`);

  const target = rng() < 0.5 ? "horizontal" : "oblique";
  setElement(scene, target, { emphasis: "target" });

  const correctId = target === "horizontal" ? "mgtan" : "mg/cos";
  const counterpart = target === "horizontal" ? "mg/cos" : "mgtan";
  const ids = [correctId, counterpart, ...shuffle(rng, DISTRACTORS).slice(0, 2)];

  const figure = mirror({ prims: toPrims(scene) }, rng() < 0.5, false);

  return {
    stageId: stage.id,
    pattern,
    statKey: `${stage.id}:${pattern}:${target}`,
    thetaDeg: theta,
    figure,
    prompt: "光っている力の大きさは？（静止している）",
    choices: (stage.shuffleChoices ? shuffle(rng, ids) : ids).map((id) => TAN_CHOICES[id]),
    correctId,
  };
}
