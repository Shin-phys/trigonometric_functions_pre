/**
 * ステージ定義（仕様書 5節）。
 * ステージの追加・並べ替え・出題構成の調整はこのファイルだけで完結するように作っている。
 *
 * deck（山札）… 1 ラウンドの中身。ここに書いた構成をシャッフルして出題する。
 *   山札の枚数の合計が、そのステージのゴール（何問正解でクリアか）になる。
 *   毎回同じ構成なので、クリアタイムを公平に比べられる。
 *   誤答で山札を使い切ったら、同じ構成の山札を新しく切って続ける。
 */
import type { Pattern } from "@/lib/problems/types";

export type GeneratorKind = "component" | "tan";

/**
 * 山札の 1 種類。answer は generator ごとに意味が違う。
 *   component : "opposite"（対辺＝sin） | "adjacent"（隣辺＝cos）
 *   tan       : "horizontal"（mg tanθ） | "oblique"（mg/cosθ）
 */
export type DeckItem = { pattern: Pattern; answer: string; count: number };

export type StageConfig = {
  id: string;
  mode: "basic" | "advanced";
  title: string;
  subtitle: string;
  /** 使う問題生成器（lib/problems/generators/*） */
  generator: GeneratorKind;
  /** 1 ラウンドの出題構成（合計がゴールの正解数） */
  deck: DeckItem[];
  /** θの範囲 [最小, 最大]（度） */
  thetaRange: [number, number];
};

export const STAGES: StageConfig[] = [
  {
    id: "S1",
    mode: "basic",
    title: "Stage 1　平面分解",
    subtitle: "水平・鉛直な面での分解",
    generator: "component",
    deck: [
      { pattern: "horizontal", answer: "opposite", count: 3 },
      { pattern: "horizontal", answer: "adjacent", count: 3 },
      { pattern: "vertical", answer: "opposite", count: 3 },
      { pattern: "vertical", answer: "adjacent", count: 3 },
    ],
    thetaRange: [20, 70],
  },
  {
    id: "S2",
    mode: "basic",
    title: "Stage 2　斜面分解",
    subtitle: "斜面上の重力の分解",
    generator: "component",
    deck: [
      { pattern: "incline", answer: "opposite", count: 6 },
      { pattern: "incline", answer: "adjacent", count: 6 },
    ],
    thetaRange: [20, 60],
  },
  {
    id: "S3",
    mode: "basic",
    title: "Stage 3　ランダム",
    subtitle: "全パターン混合・実力試し",
    generator: "component",
    deck: [
      { pattern: "horizontal", answer: "opposite", count: 2 },
      { pattern: "horizontal", answer: "adjacent", count: 2 },
      { pattern: "vertical", answer: "opposite", count: 2 },
      { pattern: "vertical", answer: "adjacent", count: 2 },
      { pattern: "incline", answer: "opposite", count: 2 },
      { pattern: "incline", answer: "adjacent", count: 2 },
    ],
    thetaRange: [20, 65],
  },
  {
    id: "A1",
    mode: "advanced",
    title: "発展　tan との使い分け",
    subtitle: "つり合いの 2 力の比率関係",
    generator: "tan",
    deck: [
      { pattern: "hang", answer: "horizontal", count: 3 },
      { pattern: "hang", answer: "oblique", count: 3 },
      { pattern: "push", answer: "horizontal", count: 3 },
      { pattern: "push", answer: "oblique", count: 3 },
    ],
    thetaRange: [20, 50],
  },
];

export function getStage(id: string | null | undefined): StageConfig | undefined {
  return STAGES.find((s) => s.id === id);
}

/** そのステージのゴール（何問正解でクリアか）＝山札の枚数 */
export function goalOf(stage: StageConfig): number {
  return stage.deck.reduce((sum, d) => sum + d.count, 0);
}
