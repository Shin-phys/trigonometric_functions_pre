/**
 * 出題データの型定義。
 * 「問題生成（lib/problems）」と「描画（components/figure）」はこの型だけでつながる。
 * 図は数学座標（y軸上向き・角度は度・反時計回り）で表す。
 */

export type Vec = { x: number; y: number };

/** 図形パターン（仕様書 4-①） */
export type Pattern =
  | "horizontal" // 水平線となす角がθ
  | "vertical" // 鉛直線となす角がθ
  | "incline" // 斜面垂直線となす角がθ（斜面上の重力分解）
  | "hang" // 発展：ひもでつるしたおもりを水平な力で引いて支える
  | "push"; // 発展：なめらかな斜面上の物体を水平な力で支える

/** 強調された辺の役割（θから見た位置） */
export type Role = "opposite" | "adjacent" | "hypotenuse";

/** 描画上の強調 */
export type Emphasis = "target" | "normal" | "muted";

export type Prim =
  | {
      kind: "line";
      a: Vec;
      b: Vec;
      style: "solid" | "dashed" | "guide";
      role?: Role;
      feedbackOnly?: boolean;
    }
  | {
      kind: "arrow";
      from: Vec;
      to: Vec;
      label?: string;
      emphasis: Emphasis;
      role?: Role;
      dashed?: boolean;
      feedbackOnly?: boolean;
    }
  | { kind: "polygon"; points: Vec[]; style: "ground" | "block" | "ball" }
  | { kind: "hatch"; a: Vec; b: Vec; side: 1 | -1 }
  | {
      kind: "arc";
      center: Vec;
      /** start→end を反時計回りに描く（sweep は 180°未満） */
      startDeg: number;
      endDeg: number;
      radius: number;
      label?: string;
      emphasis: "given" | "target" | "normal";
      feedbackOnly?: boolean;
    }
  | { kind: "rightAngle"; at: Vec; dir1Deg: number; dir2Deg: number; size: number };

export type FigureSpec = { prims: Prim[] };

export type Choice = {
  id: string;
  /** KaTeX で描画する TeX 文字列 */
  tex: string;
};

export type Problem = {
  stageId: string;
  pattern: Pattern;
  /** 誤答集計用のキー（例 "S1:vertical:opposite"） */
  statKey: string;
  thetaDeg: number;
  figure: FigureSpec;
  prompt: string;
  choices: Choice[];
  correctId: string;
};
