/**
 * ゲームルール・到達判定の定数（仕様書 6節）。
 * 授業での試行結果に応じて、ここの数値だけを調整すればよい。
 */
export const GAME = {
  /** この数だけ正解したらゴール */
  goalCorrect: 12,
  /** 開始前カウントダウン（秒） */
  countdownSec: 3,
  /** 正解時に次の問題へ進むまでの間（ミリ秒） */
  correctPauseMs: 120,
  /**
   * 誤答時のロック時間（ミリ秒）。この間「対辺＝赤／隣辺＝青」を表示し、操作できない。
   * 誤答した問題は正解数に数えず、次は新しい問題に進む。
   * 2択で当てずっぽうに押すと、1問正解するのに平均「2回押す＋ロック1回」かかるので、
   * ロックを長くするほど適当押しが不利になる。
   */
  wrongLockMs: 1500,
} as const;

/**
 * 到達（自動化）判定。直近 windowSessions 回分のプレイをまとめて判定する。
 *   正答率 ≥ minAccuracy かつ 正解時の反応時間の中央値 ≤ maxMedianMs
 */
export const MASTERY = {
  windowSessions: 3,
  minAccuracy: 0.95,
  maxMedianMs: 1000,
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
