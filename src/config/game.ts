/**
 * ゲームルール・スコア計算の定数（仕様書 6節）。
 * 授業での試行結果に応じて、ここの数値だけを調整すればよい。
 */
export const GAME = {
  /** 選べる制限時間（秒） */
  durationOptions: [45, 60, 90, 120],
  /** 開始前カウントダウン（秒） */
  countdownSec: 3,
  /** 正解時に次の問題へ進むまでの間（ミリ秒） */
  correctPauseMs: 120,
  /** 誤答時に「対辺＝赤／隣辺＝青」を見せる時間（ミリ秒）。この間は操作不可＝実質のペナルティ */
  wrongFlashMs: 700,
} as const;

/**
 * スコア計算（lib/scoring.ts で使用）
 *   1問の得点 = base + 速さボーナス（fastMs 以下で満点、slowMs 以上で 0、その間は直線）
 *   最終スコア = 得点合計 × 正答率^accuracyExponent
 * accuracyExponent を大きくするほど「正確さ」を重視する。
 */
export const SCORING = {
  basePerCorrect: 100,
  maxSpeedBonus: 50,
  fastMs: 500,
  slowMs: 1500,
  accuracyExponent: 2,
} as const;

/** 教員ダッシュボード */
export const DASHBOARD = {
  /** この秒数以内に更新があった生徒を「参加中」とみなす */
  presenceTimeoutSec: 90,
  /** 参加状況の更新間隔（秒） */
  heartbeatSec: 30,
  /** ランキングの表示件数 */
  topN: 5,
  /** 誤答パターンの表示件数 */
  weakPatternsN: 5,
  /** 誤答率の計算に必要な最小出題数 */
  weakPatternMinCount: 5,
} as const;
