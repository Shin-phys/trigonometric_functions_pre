"use client";
import { useState } from "react";
import { normalizeClassCode } from "@/lib/date";
import type { Profile } from "@/lib/storage/local";

type Props = {
  initial: Profile | null;
  online: boolean;
  onJoin: (p: Profile) => void;
  onGuest: () => void;
};

/** ルーム接続：クラスコード＋出席番号／ニックネーム（仕様書 7-①） */
export function JoinForm({ initial, online, onJoin, onGuest }: Props) {
  const [classCode, setClassCode] = useState(initial?.classCode ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const code = normalizeClassCode(classCode);
  const ok = name.trim().length > 0;

  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onJoin({ classCode: code, name: name.trim().slice(0, 20) });
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-400">クラスコード（例：1A）</span>
        <input
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          placeholder="1A"
          autoCapitalize="characters"
          className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-xl uppercase outline-none focus:border-amber-400"
        />
        <span className="text-xs text-slate-500">空欄なら「ひとりで練習」（記録は この端末だけ）</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-400">出席番号 または ニックネーム</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="12"
          maxLength={20}
          className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-xl outline-none focus:border-amber-400"
        />
      </label>
      <button
        type="submit"
        disabled={!ok}
        className="rounded-xl bg-amber-400 py-3 text-lg font-bold text-slate-900 disabled:opacity-40"
      >
        {code ? `${code} に参加する` : "ひとりで練習する"}
      </button>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-700" />
        または
        <span className="h-px flex-1 bg-slate-700" />
      </div>
      <button
        type="button"
        onClick={onGuest}
        className="rounded-xl border-2 border-slate-600 py-3 text-lg font-bold text-slate-200 hover:border-amber-400"
      >
        ゲストで遊ぶ
        <span className="block text-xs font-normal text-slate-400">入力なし・記録は送信しません</span>
      </button>
      {!online && code && (
        <p className="text-center text-xs text-slate-500">
          ローカルモード（Firebase 未設定）：記録は教員ダッシュボードに送られません
        </p>
      )}
    </form>
  );
}
