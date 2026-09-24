/** 図形計算と、図全体の反転（鏡像）ユーティリティ。 */
import type { FigureSpec, Prim, Vec } from "./types";

export const DEG = Math.PI / 180;

export const v = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => v(a.x + b.x, a.y + b.y);
export const sub = (a: Vec, b: Vec): Vec => v(a.x - b.x, a.y - b.y);
export const mul = (a: Vec, k: number): Vec => v(a.x * k, a.y * k);
export const len = (a: Vec): number => Math.hypot(a.x, a.y);
/** 角度（度）方向の単位ベクトル */
export const dir = (deg: number): Vec => v(Math.cos(deg * DEG), Math.sin(deg * DEG));
/** ベクトルの向き（度, 0〜360） */
export const angleOf = (a: Vec): number => norm360(Math.atan2(a.y, a.x) / DEG);

export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** 2方向のなす角（0〜180°） */
export function angleBetween(d1: number, d2: number): number {
  const diff = norm360(d2 - d1);
  return diff > 180 ? 360 - diff : diff;
}

/** 2方向の間の小さい方の弧を「反時計回り start→end」の形で返す */
export function minorArc(d1: number, d2: number): { startDeg: number; endDeg: number } {
  const diff = norm360(d2 - d1);
  return diff <= 180 ? { startDeg: d1, endDeg: d1 + diff } : { startDeg: d2, endDeg: d2 + (360 - diff) };
}

function mapPoint(p: Vec, fx: number, fy: number): Vec {
  return v(p.x * fx, p.y * fy);
}

/** 角度の鏡像：x反転なら 180−θ、y反転なら −θ */
function mapDeg(d: number, fx: number, fy: number): number {
  let r = d;
  if (fx < 0) r = 180 - r;
  if (fy < 0) r = -r;
  return r;
}

/** 図全体を x 軸方向（左右）・y 軸方向（上下）に反転する */
export function mirror(fig: FigureSpec, flipX: boolean, flipY: boolean): FigureSpec {
  if (!flipX && !flipY) return fig;
  const fx = flipX ? -1 : 1;
  const fy = flipY ? -1 : 1;
  const oddFlip = flipX !== flipY; // 向きが反転する（反時計回り→時計回り）
  const prims: Prim[] = fig.prims.map((p) => {
    switch (p.kind) {
      case "line":
        return { ...p, a: mapPoint(p.a, fx, fy), b: mapPoint(p.b, fx, fy) };
      case "arrow":
        return { ...p, from: mapPoint(p.from, fx, fy), to: mapPoint(p.to, fx, fy) };
      case "polygon":
        return { ...p, points: p.points.map((q) => mapPoint(q, fx, fy)) };
      case "hatch":
        return { ...p, a: mapPoint(p.a, fx, fy), b: mapPoint(p.b, fx, fy), side: (oddFlip ? -p.side : p.side) as 1 | -1 };
      case "arc": {
        const s = mapDeg(p.startDeg, fx, fy);
        const e = mapDeg(p.endDeg, fx, fy);
        return { ...p, center: mapPoint(p.center, fx, fy), startDeg: oddFlip ? e : s, endDeg: oddFlip ? s : e };
      }
      case "rightAngle":
        return {
          ...p,
          at: mapPoint(p.at, fx, fy),
          dir1Deg: mapDeg(p.dir1Deg, fx, fy),
          dir2Deg: mapDeg(p.dir2Deg, fx, fy),
        };
    }
  });
  return { prims };
}

/** 図に含まれる全ての点（描画範囲の計算用） */
export function figurePoints(fig: FigureSpec): Vec[] {
  const pts: Vec[] = [];
  for (const p of fig.prims) {
    switch (p.kind) {
      case "line":
      case "hatch":
        pts.push(p.a, p.b);
        break;
      case "arrow":
        pts.push(p.from, p.to);
        break;
      case "polygon":
        pts.push(...p.points);
        break;
      case "arc":
        pts.push(add(p.center, mul(dir((p.startDeg + p.endDeg) / 2), p.radius + 14)));
        break;
      case "rightAngle":
        pts.push(p.at);
        break;
    }
  }
  return pts;
}
