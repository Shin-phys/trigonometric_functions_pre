"use client";
/**
 * FigureSpec（lib/problems/types.ts）を SVG に描く。問題の中身は知らない「描画専用」部品。
 * feedback=true のとき、role に応じて 対辺＝赤／隣辺＝青 に塗り分ける（仕様書 6節）。
 */
import { useMemo } from "react";
import { FIGURE_COLORS as C } from "@/config/theme";
import { add, dir, figurePoints, mul, sub, len } from "@/lib/problems/geometry";
import type { FigureSpec, Prim, Role, Vec } from "@/lib/problems/types";

type Props = { figure: FigureSpec; feedback?: boolean; className?: string };

const PAD = 22;
/** 数学座標（y上向き）→ SVG 座標（y下向き） */
const s = (p: Vec) => ({ x: p.x, y: -p.y });
const pts = (ps: Vec[]) => ps.map((p) => `${s(p).x.toFixed(2)},${s(p).y.toFixed(2)}`).join(" ");

function roleColor(role: Role | undefined): string | null {
  if (role === "opposite") return C.opposite;
  if (role === "adjacent") return C.adjacent;
  return null;
}

export function FigureSvg({ figure, feedback = false, className }: Props) {
  const viewBox = useMemo(() => {
    const ps = figurePoints(figure);
    const xs = ps.map((p) => p.x);
    const ys = ps.map((p) => p.y);
    const minX = Math.min(...xs) - PAD;
    const maxX = Math.max(...xs) + PAD;
    const minY = Math.min(...ys) - PAD;
    const maxY = Math.max(...ys) + PAD;
    return `${minX.toFixed(1)} ${(-maxY).toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}`;
  }, [figure]);

  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label="問題の図">
      {figure.prims.map((p, i) => (
        <PrimView key={i} p={p} feedback={feedback} />
      ))}
    </svg>
  );
}

function PrimView({ p, feedback }: { p: Prim; feedback: boolean }) {
  if ("feedbackOnly" in p && p.feedbackOnly && !feedback) return null;

  switch (p.kind) {
    case "polygon": {
      const fill = p.style === "ground" ? C.ground : C.block;
      return <polygon points={pts(p.points)} fill={fill} stroke={C.muted} strokeWidth={1.2} strokeLinejoin="round" />;
    }

    case "hatch": {
      const d = sub(p.b, p.a);
      const n = Math.floor(len(d) / 12);
      const u = mul(d, 1 / len(d));
      const normal = mul({ x: -u.y, y: u.x }, p.side * 9);
      return (
        <g stroke={C.muted} strokeWidth={1.2}>
          {Array.from({ length: n + 1 }, (_, i) => {
            const a = add(p.a, mul(u, i * 12));
            const b = add(add(a, normal), mul(u, -6));
            return <line key={i} x1={s(a).x} y1={s(a).y} x2={s(b).x} y2={s(b).y} />;
          })}
        </g>
      );
    }

    case "line": {
      const fc = feedback ? roleColor(p.role) : null;
      const stroke = fc ?? (p.style === "solid" ? C.normal : C.muted);
      const dash = p.style === "solid" ? undefined : p.style === "guide" ? "3 4" : "6 4";
      const width = fc ? 2.4 : p.style === "guide" ? 1 : 1.4;
      return (
        <line
          x1={s(p.a).x}
          y1={s(p.a).y}
          x2={s(p.b).x}
          y2={s(p.b).y}
          stroke={stroke}
          strokeWidth={width}
          strokeDasharray={dash}
          strokeLinecap="round"
        />
      );
    }

    case "arrow": {
      const isTarget = p.emphasis === "target";
      const fc = feedback ? roleColor(p.role) : null;
      const color = fc ?? (isTarget ? C.target : p.emphasis === "muted" ? C.muted : C.normal);
      const width = isTarget ? 5 : fc ? 3.5 : 2.4;
      const v = sub(p.to, p.from);
      const L = len(v);
      const u = mul(v, 1 / L);
      const head = isTarget ? 13 : 10;
      const half = isTarget ? 7 : 5.5;
      const base = add(p.to, mul(u, -head));
      const nrm = { x: -u.y, y: u.x };
      const tri = [p.to, add(base, mul(nrm, half)), add(base, mul(nrm, -half))];
      const labelPos = add(p.to, add(mul(u, 13), mul(nrm, 9)));
      return (
        <g>
          {isTarget && (
            <line
              x1={s(p.from).x}
              y1={s(p.from).y}
              x2={s(base).x}
              y2={s(base).y}
              stroke={color}
              strokeWidth={width + 7}
              strokeOpacity={0.25}
              strokeLinecap="round"
            />
          )}
          <line
            x1={s(p.from).x}
            y1={s(p.from).y}
            x2={s(base).x}
            y2={s(base).y}
            stroke={color}
            strokeWidth={width}
            strokeDasharray={p.dashed ? "6 4" : undefined}
            strokeLinecap="round"
          />
          <polygon points={pts(tri)} fill={color} />
          {p.label && (
            <text
              x={s(labelPos).x}
              y={s(labelPos).y}
              fill={C.label}
              fontSize={15}
              fontStyle="italic"
              fontFamily="'Times New Roman', serif"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {p.label}
            </text>
          )}
        </g>
      );
    }

    case "arc": {
      const isTarget = p.emphasis === "target";
      const color = isTarget ? C.target : C.given;
      const a0 = add(p.center, mul(dir(p.startDeg), p.radius));
      const a1 = add(p.center, mul(dir(p.endDeg), p.radius));
      const large = p.endDeg - p.startDeg > 180 ? 1 : 0;
      // 数学座標で反時計回り → SVG（y反転）では sweep-flag=0
      const d = `M ${s(a0).x} ${s(a0).y} A ${p.radius} ${p.radius} 0 ${large} 0 ${s(a1).x} ${s(a1).y}`;
      const mid = add(p.center, mul(dir((p.startDeg + p.endDeg) / 2), p.radius + (isTarget ? 13 : 10)));
      const wedge = `M ${s(p.center).x} ${s(p.center).y} L ${s(a0).x} ${s(a0).y} A ${p.radius} ${p.radius} 0 ${large} 0 ${s(a1).x} ${s(a1).y} Z`;
      return (
        <g>
          {isTarget && <path d={wedge} fill={C.target} fillOpacity={0.35} />}
          <path d={d} fill="none" stroke={color} strokeWidth={isTarget ? 4 : 1.6} />
          {p.label && (
            <text
              x={s(mid).x}
              y={s(mid).y}
              fill={isTarget ? C.target : C.label}
              fontSize={isTarget ? 16 : 14}
              fontWeight={isTarget ? 700 : 400}
              fontStyle="italic"
              fontFamily="'Times New Roman', serif"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {p.label}
            </text>
          )}
        </g>
      );
    }

    case "rightAngle": {
      const a = add(p.at, mul(dir(p.dir1Deg), p.size));
      const b = add(p.at, mul(dir(p.dir2Deg), p.size));
      const c = add(a, mul(dir(p.dir2Deg), p.size));
      return <polyline points={pts([a, c, b])} fill="none" stroke={C.muted} strokeWidth={1.1} />;
    }
  }
}
