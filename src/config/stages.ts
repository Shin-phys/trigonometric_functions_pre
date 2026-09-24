/**
 * ステージ定義（仕様書 5節）。
 * ステージの追加・並べ替え・難易度調整はこのファイルだけで完結するように作っている。
 */
import type { Pattern, Role } from "@/lib/problems/types";

export type GeneratorKind = "angle" | "component" | "tan";

export type StageConfig = {
  id: string;
  mode: "basic" | "advanced";
  title: string;
  subtitle: string;
  /** 使う問題生成器（lib/problems/generators/*） */
  generator: GeneratorKind;
  /** 出題する図形パターン（ランダムに選ぶ） */
  patterns: Pattern[];
  /** θの範囲 [最小, 最大]（度） */
  thetaRange: [number, number];
  /** 標準の制限時間（秒） */
  defaultDurationSec: number;
  /** 選択肢の並びを毎問シャッフルするか */
  shuffleChoices: boolean;
  /** component: 強調する辺の出題比率 */
  roleWeights?: Record<Role, number>;
  /** component/incline: 物体側（mg と斜面垂直線の間）にも θ を表示するか */
  showDerivedAngle?: boolean;
  /** angle: 強調した角が θ と等しい問題の割合（0〜1） */
  thetaEqualRatio?: number;
};

export const STAGES: StageConfig[] = [
  {
    id: "S0",
    mode: "basic",
    title: "Stage 0　角度認識",
    subtitle: "赤く光る角は θ？ それとも 90°−θ？",
    generator: "angle",
    patterns: ["incline", "horizontal", "vertical"],
    thetaRange: [20, 70],
    defaultDurationSec: 45,
    shuffleChoices: false,
    thetaEqualRatio: 0.5,
  },
  {
    id: "S1",
    mode: "basic",
    title: "Stage 1　平面分解",
    subtitle: "水平・鉛直な面での分解",
    generator: "component",
    patterns: ["horizontal", "vertical"],
    thetaRange: [20, 70],
    defaultDurationSec: 60,
    shuffleChoices: true,
    roleWeights: { opposite: 0.4, adjacent: 0.4, hypotenuse: 0.2 },
  },
  {
    id: "S2",
    mode: "basic",
    title: "Stage 2　斜面分解",
    subtitle: "斜面上の重力の分解",
    generator: "component",
    patterns: ["incline"],
    thetaRange: [20, 60],
    defaultDurationSec: 60,
    shuffleChoices: true,
    roleWeights: { opposite: 0.45, adjacent: 0.45, hypotenuse: 0.1 },
    showDerivedAngle: true,
  },
  {
    id: "S3",
    mode: "basic",
    title: "Stage 3　ランダム",
    subtitle: "全パターン混合・実力試し",
    generator: "component",
    patterns: ["horizontal", "vertical", "incline"],
    thetaRange: [20, 65],
    defaultDurationSec: 60,
    shuffleChoices: true,
    roleWeights: { opposite: 0.45, adjacent: 0.45, hypotenuse: 0.1 },
    // 斜面では底角の θ だけを表示（Stage 0 の力が試される）
    showDerivedAngle: false,
  },
  {
    id: "A1",
    mode: "advanced",
    title: "発展　tan との使い分け",
    subtitle: "つり合いの 2 力の比率関係",
    generator: "tan",
    patterns: ["hang", "push"],
    thetaRange: [20, 50],
    defaultDurationSec: 60,
    shuffleChoices: true,
  },
];

export function getStage(id: string | null | undefined): StageConfig | undefined {
  return STAGES.find((s) => s.id === id);
}
