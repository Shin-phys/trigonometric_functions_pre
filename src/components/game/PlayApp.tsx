"use client";
/**
 * 生徒用画面（/play）の画面遷移：参加 → ステージ選択 → プレイ → リザルト（→ 復習）
 * URL で固定もできる（教員が配るリンク用）：
 *   /play/?class=1A&stage=S1   … クラス・ステージを指定
 *   /play/?guest=1             … 入力なしのゲストで始める（stage と組み合わせ可）
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DASHBOARD } from "@/config/game";
import { getStage, type StageConfig } from "@/config/stages";
import { normalizeClassCode } from "@/lib/date";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { saveResult, updatePresence, type PresenceStatus } from "@/lib/firebase/repository";
import { judgeMastery, summarize, type AnswerLog, type MasteryResult, type PlaySummary } from "@/lib/scoring";
import { GUEST_PROFILE, appendHistory, loadHistory, loadProfile, saveProfile, type Profile } from "@/lib/storage/local";
import { GameScreen } from "./GameScreen";
import { JoinForm } from "./JoinForm";
import { ResultScreen } from "./ResultScreen";
import { ReviewScreen } from "./ReviewScreen";
import { StageSelect } from "./StageSelect";

type ResultData = {
  stage: StageConfig;
  summary: PlaySummary;
  wrongLogs: AnswerLog[];
  prevMs: number | null;
  bestMs: number | null;
  mastery: MasteryResult;
};

type View =
  | { name: "join" }
  | { name: "select" }
  | { name: "game"; stage: StageConfig; round: number }
  | ({ name: "result" } & ResultData)
  | ({ name: "review" } & ResultData);

export function PlayApp() {
  const params = useSearchParams();
  const fixedStage = getStage(params.get("stage"));
  const classFromUrl = params.get("class");
  const guestFromUrl = params.get("guest") === "1";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>({ name: "join" });
  const [saveState, setSaveState] = useState<"local" | "saving" | "saved" | "error" | "guest">("local");
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
      setView({ name: "game", stage, round: Date.now() });
      presence("playing", stage.id);
    },
    [presence],
  );

  const toSelect = () => {
    setView({ name: "select" });
    presence("lobby", null);
  };

  const join = (p: Profile) => {
    if (!p.guest) saveProfile(p); // ゲストは次回の入力欄を上書きしない
    setProfile(p);
    setView(fixedStage ? { name: "game", stage: fixedStage, round: Date.now() } : { name: "select" });
  };

  // /play/?guest=1 なら入力画面を飛ばす
  useEffect(() => {
    if (guestFromUrl) join(GUEST_PROFILE);
    // 初回だけ
  }, [guestFromUrl]);

  const guest = !!profile?.guest;

  // profile 設定直後に presence を送る
  useEffect(() => {
    if (!profile) return;
    presence(view.name === "game" ? "playing" : "lobby", view.name === "game" ? view.stage.id : null);
    // profile が変わったときだけ送る（view・presence は意図的に依存に入れない）
  }, [profile]);

  const finish = useCallback(
    (stage: StageConfig) => (logs: AnswerLog[], clearMs: number) => {
      const summary = summarize(logs, clearMs);
      const history = loadHistory(stage.id, guest);
      const prevMs = history.length ? history[history.length - 1].clearMs : null;
      const bestMs = history.length ? Math.min(...history.map((h) => h.clearMs)) : null;
      const entry = {
        stageId: stage.id,
        clearMs: summary.clearMs,
        correct: summary.correct,
        total: summary.total,
        medianMs: summary.medianMs,
        rts: summary.rts,
        at: Date.now(),
      };
      appendHistory(entry, guest);
      const mastery = judgeMastery([...history, entry]);
      const wrongLogs = logs.filter((l) => !l.correct);
      setView({ name: "result", stage, summary, wrongLogs, prevMs, bestMs, mastery });
      presence("done", stage.id);

      if (guest) {
        setSaveState("guest");
      } else if (online && classCode) {
        setSaveState("saving");
        saveResult(classCode, {
          name: profile?.name ?? "",
          stageId: stage.id,
          clearMs: summary.clearMs,
          correct: summary.correct,
          total: summary.total,
          accuracy: summary.accuracy,
          medianMs: summary.medianMs,
          mastered: mastery.mastered,
          patternStats: summary.patternStats,
        })
          .then((ok) => setSaveState(ok ? "saved" : "error"))
          .catch(() => setSaveState("error"));
      } else {
        setSaveState("local");
      }
    },
    [online, classCode, profile, presence, guest],
  );

  if (view.name === "game") {
    return <GameScreen key={view.round} stage={view.stage} onFinish={finish(view.stage)} onQuit={toSelect} />;
  }

  if (view.name === "review") {
    return (
      <ReviewScreen
        stage={view.stage}
        problems={view.wrongLogs.map((l) => l.problem)}
        onDone={() => setView({ ...view, name: "result" })}
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
            {guest ? "ゲスト（入力して参加する）" : `${profile.classCode || "ひとりで練習"}・${profile.name}`}
          </button>
        )}
      </header>
      <h1 className="mb-6 text-center text-2xl font-bold">
        ベクトル分解タイムトライアル
        <span className="block text-sm font-normal text-slate-400">Vector Breakout</span>
      </h1>

      {view.name === "join" && (
        <JoinForm
          key={initialProfile?.classCode ?? "none"}
          initial={initialProfile}
          online={online}
          onJoin={join}
          onGuest={() => join(GUEST_PROFILE)}
        />
      )}
      {view.name === "select" && <StageSelect guest={guest} onSelect={start} />}
      {view.name === "result" && (
        <ResultScreen
          stage={view.stage}
          summary={view.summary}
          wrongLogs={view.wrongLogs}
          prevMs={view.prevMs}
          bestMs={view.bestMs}
          mastery={view.mastery}
          saveState={saveState}
          guest={guest}
          onRetry={() => start(view.stage)}
          onBack={toSelect}
          onReview={() => setView({ ...view, name: "review" })}
        />
      )}
    </main>
  );
}
