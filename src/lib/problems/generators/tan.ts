/**
 * 発展モード：tan との使い分け（仕様書 5節【発展モード】）
 * 3 力のつり合いで、水平な力（mg tanθ）と斜めの力（mg/cosθ）を 2 択で選ばせる。
 * 非直交・比率項はこのモードにだけ登場する。
 */
import type { StageConfig } from "@/config/stages";
import { TAN_CHOICES } from "../choices";
import { mirror } from "../geometry";
import { pickTheta, type Rng } from "../rng";
import { hangScene, pushScene, setElement, toPrims } from "../scenes";
import type { Problem, Slot } from "../types";

export function generateTanProblem(stage: StageConfig, slot: Slot, rng: Rng): Problem {
  const { pattern } = slot;
  const target = slot.answer;
  if (target !== "horizontal" && target !== "oblique") throw new Error(`invalid tan answer: ${slot.answer}`);
  const theta = pickTheta(rng, stage.thetaRange, 0);
  const scene = pattern === "hang" ? hangScene(theta) : pattern === "push" ? pushScene(theta) : null;
  if (!scene) throw new Error(`tan generator does not support pattern: ${pattern}`);

  setElement(scene, target, { emphasis: "target" });
  const figure = mirror({ prims: toPrims(scene) }, rng() < 0.5, false);

  return {
    stageId: stage.id,
    pattern,
    statKey: `${stage.id}:${pattern}:${target}`,
    thetaDeg: theta,
    figure,
    prompt: "光っている力の大きさは？（静止している）",
    choices: TAN_CHOICES,
    correctId: target === "horizontal" ? "mgtan" : "mg/cos",
  };
}
