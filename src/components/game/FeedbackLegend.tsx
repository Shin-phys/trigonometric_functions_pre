import type { GeneratorKind } from "@/config/stages";

/** 誤答時・振り返り時の凡例（対辺＝赤／隣辺＝青） */
export function FeedbackLegend({ generator, small = false }: { generator: GeneratorKind; small?: boolean }) {
  const size = small ? "text-xs" : "text-sm";
  if (generator === "tan") {
    return (
      <span className={`${size} font-bold`}>
        <span className="text-rose-400">対辺</span> ÷ <span className="text-blue-400">隣辺</span> ＝ tanθ
      </span>
    );
  }
  return (
    <span className={`flex gap-3 ${size} font-bold`}>
      <span className="text-rose-400">対辺 → sin</span>
      <span className="text-blue-400">隣辺 → cos</span>
    </span>
  );
}
