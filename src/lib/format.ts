/** ミリ秒 → 「12.34」（秒, 小数 2 桁） */
export const formatSec = (ms: number): string => (ms / 1000).toFixed(2);
