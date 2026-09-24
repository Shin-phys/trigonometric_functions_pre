"use client";
import katex from "katex";
import { useMemo } from "react";

/** KaTeX で数式を描く（仕様書 8節） */
export function Tex({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, output: "html" }), [tex]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
