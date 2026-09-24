# Firebase の準備

Firebase なしでも「ローカルモード」で動くが、教員ダッシュボードにリアルタイムで集計するには以下を行う。
（無料の Spark プランで足りる規模）

## 1. プロジェクトとウェブアプリを作る

1. <https://console.firebase.google.com/> でプロジェクトを作成（Google アナリティクスは不要）
2. 「プロジェクトの設定 → マイアプリ → ウェブ（`</>`）」でアプリを登録
3. 表示される `firebaseConfig` の 6 項目を控える

## 2. 匿名認証を有効にする

**Authentication → Sign-in method → 匿名** を有効にする。

**Authentication → 設定 → 承認済みドメイン** に次を追加：

- `shin-phys.github.io`
- （ローカル開発用の `localhost` は最初から入っている）

## 3. Firestore を作る

1. **Firestore Database → データベースを作成**（ロケーションは `asia-northeast1`（東京）推奨、本番モード）
2. **ルール** タブに [`firebase/firestore.rules`](../firebase/firestore.rules) の内容を貼り付けて公開

   Firebase CLI を使う場合：
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # 作ったプロジェクトを選ぶ
   firebase deploy --only firestore:rules
   ```

## 4. 設定値をアプリに渡す

### ローカル開発

`.env.example` を `.env.local` にコピーして 6 項目を記入。

### GitHub Pages（本番）

リポジトリの **Settings → Secrets and variables → Actions → Variables タブ → New repository variable** で登録：

| 名前 | firebaseConfig の項目 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |

登録後、Actions タブから「Deploy to GitHub Pages」を再実行（Run workflow）すると反映される。

> Web アプリの Firebase 設定値はブラウザに配信される前提の値で、秘密情報ではない。
> アクセス制御は Firestore ルールと匿名認証で行っている。

## 5. 補足

- 記録は `classes/{クラス}/days/{日付}/...` に溜まる。古いデータは Firestore コンソールから日付単位で削除できる
- ルール上、匿名ログインした人はクラスの記録を読める（ランキング表示のため）。
  生徒には本名ではなく出席番号かニックネームで参加させる
