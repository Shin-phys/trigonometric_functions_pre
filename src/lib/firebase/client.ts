/**
 * Firebase の初期化（匿名認証 + Firestore）。
 * 環境変数が未設定なら null を返し、アプリは「ローカルモード」で動く。
 */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let userPromise: Promise<User> | null = null;

export function getDb(): Firestore | null {
  if (!isFirebaseConfigured || typeof window === "undefined") return null;
  if (!app) app = getApps()[0] ?? initializeApp(config);
  if (!db) db = getFirestore(app);
  return db;
}

/** 匿名ログイン（1 回だけ実行し、以後は同じ uid を使う） */
export function ensureUser(): Promise<User> | null {
  if (!getDb() || !app) return null;
  if (!userPromise) {
    const auth = getAuth(app);
    userPromise = auth.currentUser
      ? Promise.resolve(auth.currentUser)
      : signInAnonymously(auth).then((c) => c.user);
    userPromise.catch(() => (userPromise = null));
  }
  return userPromise;
}
