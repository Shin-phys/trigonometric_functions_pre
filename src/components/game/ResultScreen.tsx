"use client";
import { useState } from "react";
import { FigureSvg } from "@/components/figure/FigureSvg";
import { Tex } from "@/components/ui/Tex";
import { MASTERY } from "@/config/game";
import type { StageConfig } from "@/config/stages";
import type { AnswerLog, MasteryResult, PlaySummary } from "@/lib/scoring";
import { FeedbackLegend } from "./FeedbackLegend";
import { formatSec } from "@/lib/format";

type Props = {
  stage: StageConfig;
  summary: PlaySummary;
  wrongLogs: AnswerLog[];
  /** このプレイより前の記録 */
  prevMs: number | null;
  bestMs: number | null;
  mastery: MasteryResult;
  saveState: "local" | "saving" | "saved" | "error" | "guest";
  /** ゲストは到達判定を表示しない（気軽に遊ぶモード） */
  guest?: boolean;
  onRetry: () => void;
  onBack: () => void;
  onReview: () => void;
};

/** リザルト：クリアタイム・前回比較・到達判定・間違えた問題の図（仕様書 7-①） */
export function ResultScreen({ stage, summary, wrongLogs, prevMs, bestMs, mastery, saveState, guest = false, onRetry, onBack, onReview }: Props) {
  const [zoom, setZoom] = useState<AnswerLog | null>(null);
  const diff = prevMs !== null ? summary.clearMs - prevMs : null;
  const newBest = bestMs !== null && summary.clearMs < bestMs;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <p className="text-center text-sm text-slate-400">{stage.title}</p>

      <div className="text-center">
        <p className="text-sm text-slate-400">クリアタイム</p>
        <p className="text-7xl font-bold tabular-nums text-amber-400">
          {formatSec(summary.clearMs)}
          <span className="text-2xl">秒</span>
        </p>
        {diff !== null && (
          <p className={`mt-1 text-lg font-bold ${diff <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            前回 {formatSec(prevMs!)}秒 → {diff <= 0 ? "−" : "+"}
            {formatSec(Math.abs(diff))}秒
          </p>
        )}
        {newBest && <p className="mt-1 font-bold text-amber-300">自己ベスト更新！</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="正答率" value={`${Math.round(summary.accuracy * 100)}%`} />
        <Stat label="ミス" value={`${summary.total - summary.correct}回`} />
        <Stat label="反応（中央値）" value={`${formatSec(summary.medianMs)}秒`} />
      </div>

      {!guest && <MasteryPanel mastery={mastery} />}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-xl bg-slate-800 py-3 font-bold">
          ステージ選択
        </button>
        <button onClick={onRetry} className="flex-1 rounded-xl bg-amber-400 py-3 font-bold text-slate-900">
          もう一度
        </button>
      </div>

      {/* 間違えた問題 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">間違えた問題</h2>
          {wrongLogs.length > 0 && (
            <button onClick={onReview} className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-bold">
              間違えた問題だけもう一度
            </button>
          )}
        </div>
        {wrongLogs.length === 0 ? (
          <p className="rounded-2xl bg-slate-800 p-4 text-center font-bold text-emerald-400">ノーミス！</p>
        ) : (
          <>
            <div className="flex justify-center">
              <FeedbackLegend generator={stage.generator} small />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {wrongLogs.map((l, i) => (
                <WrongCard key={i} log={l} generator={stage.generator} onClick={() => setZoom(l)} />
              ))}
            </div>
          </>
        )}
      </section>

      <p className="text-center text-xs text-slate-500">
        {saveState === "saving" && "記録を送信中…"}
        {saveState === "saved" && "記録を送信しました"}
        {saveState === "error" && "記録を送信できませんでした（この端末には保存済み）"}
        {saveState === "local" && "記録はこの端末に保存しました"}
        {saveState === "guest" && "ゲストのため記録は送信しません（ベストはこの端末に残ります）"}
      </p>

      {zoom && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-4" onClick={() => setZoom(null)}>
          <div className="flex justify-end">
            <button className="rounded-lg px-3 py-1 text-slate-400">✕ 閉じる</button>
          </div>
          <p className="text-center text-sm text-slate-400">{zoom.problem.prompt}</p>
          <FigureSvg figure={zoom.problem.figure} feedback className="min-h-0 w-full flex-1" />
          <div className="flex justify-center py-2">
            <FeedbackLegend generator={stage.generator} />
          </div>
          <AnswerPair log={zoom} large />
        </div>
      )}
    </div>
  );
}

function WrongCard({ log, generator, onClick }: { log: AnswerLog; generator: StageConfig["generator"]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col rounded-2xl bg-slate-900 p-2 text-left active:bg-slate-800">
      <FigureSvg figure={log.problem.figure} feedback className="aspect-[4/3] w-full" />
      <AnswerPair log={log} />
    </button>
  );
}

function AnswerPair({ log, large = false }: { log: AnswerLog; large?: boolean }) {
  const tex = (id: string) => log.problem.choices.find((c) => c.id === id)?.tex ?? id;
  const size = large ? "text-xl" : "text-sm";
  return (
    <div className={`flex justify-around gap-2 ${size}`}>
      <span>
        <span className="mr-1 text-xs text-emerald-400">正解</span>
        <Tex tex={tex(log.problem.correctId)} />
      </span>
      <span className="text-slate-400">
        <span className="mr-1 text-xs text-rose-400">あなた</span>
        <Tex tex={tex(log.chosenId)} />
      </span>
    </div>
  );
}

function MasteryPanel({ mastery }: { mastery: MasteryResult }) {
  const check = (ok: boolean) => (ok ? "text-emerald-400" : "text-slate-500");
  return (
    <div className={`rounded-2xl p-4 ${mastery.mastered ? "bg-emerald-950 ring-2 ring-emerald-500" : "bg-slate-800"}`}>
      <p className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>{mastery.mastered ? "到達！ 考えずに選べています" : "到達判定"}</span>
        <span className="text-xs font-normal text-slate-400">
          直近 {mastery.sessions}/{MASTERY.windowSessions} 回分
        </span>
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        <li className={`flex justify-between ${check(mastery.accuracyOk)}`}>
          <span>{mastery.accuracyOk ? "✓" : "・"} 正答率 {Math.round(MASTERY.minAccuracy * 100)}%以上</span>
          <span className="tabular-nums">{Math.round(mastery.accuracy * 100)}%</span>
        </li>
        <li className={`flex justify-between ${check(mastery.speedOk)}`}>
          <span>
            {mastery.speedOk ? "✓" : "・"} 反応の中央値 {formatSec(MASTERY.maxMedianMs)}秒以下
          </span>
          <span className="tabular-nums">{formatSec(mastery.medianMs)}秒</span>
        </li>
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-800 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
