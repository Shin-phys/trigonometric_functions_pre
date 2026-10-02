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
  horizontal: "水平な力（tan）",
  oblique: "斜めの力（1/cos）",
};


/** 誤答集計キー（"S1:vertical:opposite" など）を表示用の文に変換 */
export function describeStatKey(key: string): { stage: string; text: string } {
  const [stageId, pattern, detail] = key.split(":");
  const stage = getStage(stageId)?.title.replace(/　.*/, "") ?? stageId;
  const p = PATTERN_LABEL[pattern] ?? pattern;
  const d = ROLE_LABEL[detail] ?? detail;
  return { stage, text: `${p}・${d}` };
}
