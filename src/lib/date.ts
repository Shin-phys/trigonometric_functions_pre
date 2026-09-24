/** 「本日」を日本時間の YYYYMMDD で表す（端末の時刻設定によらずクラスで揃える） */
export function todayKey(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10).replace(/-/g, "");
}

export function normalizeClassCode(raw: string): string {
  // 全角英数を半角に、英字は大文字に（「１ａ」→「1A」）
  return raw
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toUpperCase()
    .replace(/[^0-9A-Z_-]/g, "")
    .slice(0, 12);
}
