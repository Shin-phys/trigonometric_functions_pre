/** 乱数ユーティリティ。テストで再現できるよう、乱数源を差し替え可能にしている。 */
export type Rng = () => number;

/** シード付き乱数（mulberry32） */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const defaultRng: Rng = Math.random;

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickWeighted<K extends string>(rng: Rng, weights: Record<K, number>): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r < 0) return k;
  }
  return entries[entries.length - 1][0];
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * θ を整数度で選ぶ。avoidNear45 を指定すると 45° 付近（θ と 90°−θ が見分けにくい）を除外する。
 */
export function pickTheta(rng: Rng, [min, max]: [number, number], avoidNear45 = 0): number {
  for (let i = 0; i < 100; i++) {
    const t = randInt(rng, min, max);
    if (Math.abs(t - 45) >= avoidNear45) return t;
  }
  return min;
}
