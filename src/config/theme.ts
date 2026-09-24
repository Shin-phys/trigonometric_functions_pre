/**
 * 図の配色。仕様書 6節「対辺＝赤（sin）／隣辺＝青（cos）」のフィードバック色と
 * 出題時の強調色が混同されないよう、強調色は黄橙にしている（変更はここで）。
 */
export const FIGURE_COLORS = {
  target: "#f59e0b", // 出題の強調（太線）
  opposite: "#ef4444", // 誤答時：対辺＝sin
  adjacent: "#3b82f6", // 誤答時：隣辺＝cos
  hypotenuse: "#a855f7", // 誤答時：斜辺（参考）
  normal: "#e2e8f0", // 通常の線
  muted: "#64748b", // 補助線
  given: "#94a3b8", // 既知の θ
  ground: "#334155", // 斜面・床
  block: "#475569", // 物体
  label: "#f8fafc",
} as const;
