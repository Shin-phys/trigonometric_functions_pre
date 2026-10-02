/**
 * 端末内の保存（localStorage）。
 *  - 入力したクラスコード・名前（次回の入力を省くため）
 *  - ステージごとの過去の記録（自己ベスト・前回比較・到達判定用。Firebase なしでも動く）
 *    ゲストの記録は別の場所に保存し、同じ端末を使う生徒本人の記録（到達判定）に混ざらないようにする
 * localStorage が使えない環境（プライベートブラウズ等）でも落ちないよう try/catch で包む。
 */
const PROFILE_KEY = "vb:profile";
const HISTORY_KEY = "vb:history:v3";
const GUEST_HISTORY_KEY = "vb:history:v3:guest";
const HISTORY_MAX = 200;

export type Profile = {
  classCode: string;
  name: string;
  /** ゲスト（入力なしで遊ぶ）。記録は送信せず、端末内でも生徒本人の記録と分けて保存する */
  guest?: boolean;
};

export const GUEST_PROFILE: Profile = { classCode: "", name: "ゲスト", guest: true };

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

const historyKey = (guest: boolean) => (guest ? GUEST_HISTORY_KEY : HISTORY_KEY);

/** 古い順 */
export function loadHistory(stageId: string, guest = false): HistoryEntry[] {
  return read<HistoryEntry[]>(historyKey(guest), []).filter((h) => h.stageId === stageId);
}

export function appendHistory(entry: HistoryEntry, guest = false): void {
  const all = read<HistoryEntry[]>(historyKey(guest), []);
  all.push(entry);
  write(historyKey(guest), all.slice(-HISTORY_MAX));
}
