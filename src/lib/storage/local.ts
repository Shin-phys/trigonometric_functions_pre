/**
 * 端末内の保存（localStorage）。
 *  - 入力したクラスコード・名前（次回の入力を省くため）
 *  - ステージごとの過去の記録（自己ベスト・前回比較・到達判定用。Firebase なしでも動く）
 * localStorage が使えない環境（プライベートブラウズ等）でも落ちないよう try/catch で包む。
 */
const PROFILE_KEY = "vb:profile";
const HISTORY_KEY = "vb:history:v3";
const HISTORY_MAX = 200;

export type Profile = { classCode: string; name: string };

export type HistoryEntry = {
  stageId: string;
  clearMs: number;
  correct: number;
  total: number;
  medianMs: number;
  rts: number[];
  at: number;
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 保存できなくてもプレイは続けられる */
  }
}

export const loadProfile = (): Profile | null => read<Profile | null>(PROFILE_KEY, null);
export const saveProfile = (p: Profile): void => write(PROFILE_KEY, p);

/** 古い順 */
export function loadHistory(stageId: string): HistoryEntry[] {
  return read<HistoryEntry[]>(HISTORY_KEY, []).filter((h) => h.stageId === stageId);
}

export function appendHistory(entry: HistoryEntry): void {
  const all = read<HistoryEntry[]>(HISTORY_KEY, []);
  all.push(entry);
  write(HISTORY_KEY, all.slice(-HISTORY_MAX));
}
