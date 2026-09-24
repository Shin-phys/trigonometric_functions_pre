/**
 * 画面に出す日本語ラベル（出題パターン名・誤答集計の表示名など）。
 * 文言の修正はこのファイルで行う。
 */
import { getStage } from "@/config/stages";

export const PATTERN_LABEL: Record<string, string> = {
  horizontal: "水平パターン",
  vertical: "鉛直パターン",
  incline: "斜面パターン",
  hang: "つるして水平に引く",
  push: "斜面を水平に押す",
};

export const ROLE_LABEL: Record<string, string> = {
  opposite: "対辺（sin）",
  adjacent: "隣辺（cos）",
  hypotenuse: "斜辺（力そのもの）",
  horizontal: "水平な力（tan）",
  oblique: "斜めの力（1/cos）",
};

/** Stage 0 の候補角（lib/problems/generators/angle.ts の id）の説明 */
export const ANGLE_CANDIDATE_LABEL: Record<string, string> = {
  "O-vec-other": "力ともう一方の軸（90°−θ）",
  "O-vec-negref": "力と基準線の逆向き（180°−θ）",
  "O-vec-negother": "力ともう一方の軸の逆向き（90°+θ）",
  "P-alt": "先端の錯角（θ）",
  "P-other": "先端の角（90°−θ）",
  "G-mg-normal": "mg と斜面垂直線（θ）",
  "G-mg-slope": "mg と斜面（90°−θ）",
  "G-up-normalout": "鉛直上向きと垂直線の外向き（θ）",
  "G-horiz-slopedown": "水平線と斜面下向き（θ）",
  "G-upslope-up": "斜面上向きと鉛直上向き（90°−θ）",
  "G-mg-upslope": "mg と斜面上向き（90°+θ）",
  "G-horiz-normalout": "水平線と垂直線の外向き（90°−θ）",
  "G-horizR-slopedown": "逆側の水平線と斜面下向き（180°−θ）",
  "T-top": "斜面の頂角（90°−θ）",
};

/** 誤答集計キー（"S1:vertical:opposite" など）を表示用の文に変換 */
export function describeStatKey(key: string): { stage: string; text: string } {
  const [stageId, pattern, detail] = key.split(":");
  const stage = getStage(stageId)?.title.replace(/　.*/, "") ?? stageId;
  const p = PATTERN_LABEL[pattern] ?? pattern;
  const d = ANGLE_CANDIDATE_LABEL[detail] ?? ROLE_LABEL[detail] ?? detail;
  return { stage, text: `${p}・${d}` };
}
