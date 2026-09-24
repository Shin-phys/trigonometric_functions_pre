"use client";
/**
 * 教員・投影用ダッシュボード（/dashboard）。プロジェクター投影を想定し、大きな文字で表示する。
 *   /dashboard/?class=1A        … クラスを指定して表示
 *   /dashboard/?class=1A&demo=1 … 見本データで表示（Firebase なしでレイアウト確認）
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { STAGES, getStage } from "@/config/stages";
import { describeStatKey } from "@/content/labels";
import { computeStats } from "@/lib/dashboard";
import { normalizeClassCode, todayKey } from "@/lib/date";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribeClassDay, type PresenceDoc, type ResultDoc } from "@/lib/firebase/repository";
import { demoPresence, demoResults } from "./demoData";

export function DashboardApp() {
  const params = useSearchParams();
  const demo = params.get("demo") === "1";
  const [classCode, setClassCode] = useState(normalizeClassCode(params.get("class") ?? ""));
  const [input, setInput] = useState(classCode);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [results, setResults] = useState<ResultDoc[]>([]);
  const [presence, setPresence] = useState<(PresenceDoc & { uid: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const day = todayKey();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!classCode) return;
    if (demo) {
      setResults(demoResults());
      setPresence(demoPresence());
      return;
    }
    if (!isFirebaseConfigured) return;
    setError(null);
    return subscribeClassDay(classCode, day, {
      onResults: setResults,
      onPresence: setPresence,
      onError: (e) => setError(e.message),
    });
  }, [classCode, day, demo]);

  const stats = useMemo(() => computeStats(results, presence, stageFilter, now), [results, presence, stageFilter, now]);

  if (!classCode) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-white">
        <h1 className="text-3xl font-bold">教員ダッシュボード</h1>
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const c = normalizeClassCode(input);
            if (!c) return;
            setClassCode(c);
            const url = new URL(window.location.href);
            url.searchParams.set("class", c);
            window.history.replaceState(null, "", url);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="クラスコード（例：1A）"
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-xl uppercase outline-none focus:border-amber-400"
          />
          <button className="rounded-xl bg-amber-400 px-6 font-bold text-slate-900">表示</button>
        </form>
        {!isFirebaseConfigured && (
          <p className="max-w-md text-center text-sm text-slate-400">
            Firebase が未設定のため、生徒の記録は集まりません（docs/firebase-setup.md 参照）。
            URL に <code>&amp;demo=1</code> を付けると見本データで表示できます。
          </p>
        )}
        <Link href="/" className="text-sm text-slate-500">
          ← トップ
        </Link>
      </main>
    );
  }

  const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);
  const stageShort = (id: string) => getStage(id)?.title.split("　")[0] ?? id;

  return (
    <main className="min-h-dvh bg-slate-950 p-4 text-white lg:p-8">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold lg:text-4xl">
          {classCode}
          <span className="ml-3 text-lg font-normal text-slate-400">
            {day.slice(0, 4)}/{day.slice(4, 6)}/{day.slice(6)}
            {demo && "（見本データ）"}
          </span>
        </h1>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="ml-auto rounded-xl border border-slate-600 bg-slate-800 px-3 py-2"
        >
          <option value="all">すべてのステージ</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </header>

      {error && <p className="mb-4 rounded-xl bg-rose-950 p-3 text-rose-300">接続エラー：{error}</p>}
      {!isFirebaseConfigured && !demo && (
        <p className="mb-4 rounded-xl bg-slate-800 p-3 text-slate-300">
          Firebase 未設定のため記録を受信できません。URL に &amp;demo=1 を付けると見本表示になります。
        </p>
      )}

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Big label="参加中" value={`${stats.activeCount}人`} sub={`プレイ中 ${stats.playingCount}人`} />
        <Big label="平均正答率" value={pct(stats.avgAccuracy)} />
        <Big label="平均スコア" value={stats.avgScore === null ? "—" : Math.round(stats.avgScore).toString()} />
        <Big label="プレイ回数" value={`${stats.resultCount}回`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="本日のハイスコア TOP5">
          <Ranking
            rows={stats.topScores.map((r) => ({
              name: r.name,
              value: r.score.toString(),
              note: `${stageShort(r.stageId)}・${pct(r.accuracy)}`,
            }))}
          />
        </Panel>
        <Panel title="スコア伸び TOP5（前回比）">
          <Ranking
            rows={stats.topGrowth.map((r) => ({
              name: r.name,
              value: `+${r.growth}`,
              note: `${stageShort(r.stageId)}・${r.prevScore}→${r.score}`,
            }))}
          />
        </Panel>
        <Panel title="誤答率が高い出題パターン">
          {stats.weakPatterns.length === 0 ? (
            <Empty />
          ) : (
            <ul className="flex flex-col gap-3">
              {stats.weakPatterns.map((w) => {
                const d = describeStatKey(w.key);
                return (
                  <li key={w.key}>
                    <div className="flex justify-between gap-2 text-lg">
                      <span>
                        <span className="mr-2 text-sm text-slate-400">{d.stage}</span>
                        {d.text}
                      </span>
                      <span className="tabular-nums font-bold text-rose-400">{Math.round(w.rate * 100)}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700">
                      <div className="h-full bg-rose-500" style={{ width: `${w.rate * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>
    </main>
  );
}

function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-slate-800 p-4 lg:p-6">
      <p className="text-slate-400">{label}</p>
      <p className="text-4xl font-bold tabular-nums lg:text-6xl">{value}</p>
      {sub && <p className="text-sm text-slate-400">{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4 lg:p-6">
      <h2 className="mb-4 text-xl font-bold text-amber-400">{title}</h2>
      {children}
    </div>
  );
}

function Ranking({ rows }: { rows: { name: string; value: string; note: string }[] }) {
  if (!rows.length) return <Empty />;
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <li key={i} className="flex items-baseline gap-3 text-xl lg:text-2xl">
          <span className="w-6 text-slate-500">{i + 1}</span>
          <span className="flex-1 truncate">{r.name}</span>
          <span className="text-sm text-slate-400">{r.note}</span>
          <span className="w-20 text-right font-bold tabular-nums">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}

function Empty() {
  return <p className="text-slate-500">まだデータがありません</p>;
}
