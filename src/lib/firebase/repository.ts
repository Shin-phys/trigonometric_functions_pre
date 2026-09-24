/**
 * Firestore への読み書きをまとめた層。画面側はここの関数だけを使う。
 * データ構造（firebase/firestore.rules と対応）:
 *   classes/{classCode}/days/{yyyymmdd}/results/{autoId}
 *   classes/{classCode}/days/{yyyymmdd}/presence/{uid}
 */
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  setDoc,
  doc,
  type Timestamp,
} from "firebase/firestore";
import type { PatternStat } from "@/lib/scoring";
import { todayKey } from "@/lib/date";
import { ensureUser, getDb } from "./client";

export type PresenceStatus = "lobby" | "playing" | "done";

export type ResultDoc = {
  uid: string;
  name: string;
  stageId: string;
  durationSec: number;
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  avgMs: number;
  /** 同じステージの前回スコア（伸び率ランキング用）。初回は null */
  prevScore: number | null;
  patternStats: Record<string, PatternStat>;
  createdAt?: Timestamp;
};

export type PresenceDoc = {
  name: string;
  status: PresenceStatus;
  stageId: string | null;
  updatedAt?: Timestamp;
};

const dayPath = (classCode: string, day = todayKey()) => `classes/${classCode}/days/${day}`;

export async function saveResult(classCode: string, result: Omit<ResultDoc, "uid" | "createdAt">): Promise<boolean> {
  const db = getDb();
  const u = ensureUser();
  if (!db || !u) return false;
  const user = await u;
  await addDoc(collection(db, `${dayPath(classCode)}/results`), {
    ...result,
    uid: user.uid,
    createdAt: serverTimestamp(),
  });
  return true;
}

export async function updatePresence(
  classCode: string,
  data: Omit<PresenceDoc, "updatedAt">,
): Promise<void> {
  const db = getDb();
  const u = ensureUser();
  if (!db || !u) return;
  const user = await u;
  await setDoc(doc(db, `${dayPath(classCode)}/presence/${user.uid}`), { ...data, updatedAt: serverTimestamp() });
}

/** ダッシュボード用：本日の結果と参加状況をリアルタイム購読する */
export function subscribeClassDay(
  classCode: string,
  day: string,
  handlers: {
    onResults: (rows: ResultDoc[]) => void;
    onPresence: (rows: (PresenceDoc & { uid: string })[]) => void;
    onError: (e: Error) => void;
  },
): () => void {
  const db = getDb();
  const u = ensureUser();
  if (!db || !u) return () => {};
  let unsubs: (() => void)[] = [];
  let cancelled = false;
  u.then(() => {
    if (cancelled) return;
    unsubs = [
      onSnapshot(
        collection(db, `${dayPath(classCode, day)}/results`),
        (snap) => handlers.onResults(snap.docs.map((d) => d.data() as ResultDoc)),
        handlers.onError,
      ),
      onSnapshot(
        collection(db, `${dayPath(classCode, day)}/presence`),
        (snap) => handlers.onPresence(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as PresenceDoc) }))),
        handlers.onError,
      ),
    ];
  }).catch(handlers.onError);
  return () => {
    cancelled = true;
    unsubs.forEach((f) => f());
  };
}
