"use client";
/**
 * 生徒用画面（/play）の画面遷移：参加 → ステージ選択 → プレイ → リザルト
 * URL で固定もできる（教員が配るリンク用）：
 *   /play/?class=1A&stage=S3&t=60   … クラス・ステージ・制限時間を指定
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DASHBOARD } from "@/config/game";
import { getStage, type StageConfig } from "@/config/stages";
import { normalizeClassCode } from "@/lib/date";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { saveResult, updatePresence, type PresenceStatus } from "@/lib/firebase/repository";
import { summarize, type AnswerLog, type PlaySummary } from "@/lib/scoring";
import {
  appendHistory,
  loadHistory,
  loadProfile,
  saveProfile,
  type HistoryEntry,
  type Profile,
} from "@/lib/storage/local";
import { GameScreen } from "./GameScreen";
import { JoinForm } from "./JoinForm";
import { ResultScreen } from "./ResultScreen";
import { StageSelect } from "./StageSelect";

type View =
  | { name: "join" }
  | { name: "select" }
  | { name: "game"; stage: StageConfig; durationSec: number; round: number }
  | {
      name: "result";
      stage: StageConfig;
      durationSec: number;
      summary: PlaySummary;
      prev: HistoryEntry | null;
      best: number | null;
    };

export function PlayApp() {
  const params = useSearchParams();
  const fixedStage = getStage(params.get("stage"));
  const fixedDuration = Number(params.get("t")) || null;
  const classFromUrl = params.get("class");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>({ name: "join" });
  const [duration, setDuration] = useState<number | null>(fixedDuration);
  const [saveState, setSaveState] = useState<"local" | "saving" | "saved" | "error">("local");
  const status = useRef<{ status: PresenceStatus; stageId: string | null }>({ status: "lobby", stageId: null });

  useEffect(() => {
    const p = loadProfile();
    setInitialProfile(classFromUrl ? { classCode: normalizeClassCode(classFromUrl), name: p?.name ?? "" } : p);
  }, [classFromUrl]);

  const online = isFirebaseConfigured;
  const classCode = profile?.classCode ?? "";

  // 参加状況（ダッシュボードの「参加人数」）
  const presence = useCallback(
    (s: PresenceStatus, stageId: string | null) => {
      status.current = { status: s, stageId };
      if (online && profile?.classCode) {
        updatePresence(profile.classCode, { name: profile.name, status: s, stageId }).catch(() => {});
      }
    },
    [online, profile],
  );

  useEffect(() => {
    if (!online || !profile?.classCode) return;
    const id = setInterval(() => presence(status.current.status, status.current.stageId), DASHBOARD.heartbeatSec * 1000);
    return () => clearInterval(id);
  }, [online, profile, presence]);

  const start = useCallback(
    (stage: StageConfig) => {
      const durationSec = duration ?? stage.defaultDurationSec;
      setView((v) => ({ name: "game", stage, durationSec, round: v.name === "game" ? v.round + 1 : Date.now() }));
      presence("playing", stage.id);
    },
    [duration, presence],
  );

  const join = (p: Profile) => {
    saveProfile(p);
    setProfile(p);
    if (fixedStage) {
      const durationSec = duration ?? fixedStage.defaultDurationSec;
      setView({ name: "game", stage: fixedStage, durationSec, round: Date.now() });
    } else {
      setView({ name: "select" });
    }
  };

  // profile 設定直後に presence を送る
  useEffect(() => {
    if (!profile) return;
    presence(view.name === "game" ? "playing" : "lobby", view.name === "game" ? view.stage.id : null);
  }, [profile]);

  const finish = useCallback(
    (stage: StageConfig, durationSec: number) => (logs: AnswerLog[]) => {
      const summary = summarize(logs);
      const history = loadHistory(stage.id);
      const prev = history.length ? history[history.length - 1] : null;
      const best = history.length ? Math.max(...history.map((h) => h.score)) : null;
      appendHistory({ stageId: stage.id, score: summary.score, accuracy: summary.accuracy, avgMs: summary.avgMs, at: Date.now() });
      setView({ name: "result", stage, durationSec, summary, prev, best });
      presence("done", stage.id);

      if (online && classCode) {
        setSaveState("saving");
        saveResult(classCode, {
          name: profile?.name ?? "",
          stageId: stage.id,
          durationSec,
          score: summary.score,
          correct: summary.correct,
          total: summary.total,
          accuracy: summary.accuracy,
          avgMs: summary.avgMs,
          prevScore: prev?.score ?? null,
          patternStats: summary.patternStats,
        })
          .then((ok) => setSaveState(ok ? "saved" : "error"))
          .catch(() => setSaveState("error"));
      } else {
        setSaveState("local");
      }
    },
    [online, classCode, profile, presence],
  );

  if (view.name === "game") {
    return (
      <GameScreen
        key={view.round}
        stage={view.stage}
        durationSec={view.durationSec}
        onFinish={finish(view.stage, view.durationSec)}
        onQuit={() => {
          setView({ name: "select" });
          presence("lobby", null);
        }}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6 text-white">
      <header className="mx-auto mb-6 flex max-w-md items-center justify-between">
        <Link href="/" className="text-sm text-slate-400">
          ← トップ
        </Link>
        {profile && (
          <button onClick={() => setView({ name: "join" })} className="text-sm text-slate-400">
            {profile.classCode || "ひとりで練習"}・{profile.name}
          </button>
        )}
      </header>
      <h1 className="mb-6 text-center text-2xl font-bold">
        ベクトル分解タイムトライアル
        <span className="block text-sm font-normal text-slate-400">Vector Breakout</span>
      </h1>

      {view.name === "join" && <JoinForm key={initialProfile?.classCode ?? "none"} initial={initialProfile} online={online} onJoin={join} />}
      {view.name === "select" && <StageSelect duration={duration} onDuration={setDuration} onSelect={start} />}
      {view.name === "result" && (
        <ResultScreen
          stage={view.stage}
          summary={view.summary}
          prev={view.prev}
          best={view.best}
          saveState={saveState}
          onRetry={() => start(view.stage)}
          onBack={() => {
            setView({ name: "select" });
            presence("lobby", null);
          }}
        />
      )}
    </main>
  );
}
