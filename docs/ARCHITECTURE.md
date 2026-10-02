# フォルダ構成と改訂ガイド

「どこを直せば何が変わるか」が 1 対 1 になるように分けている。
特に **設定（config）・文言（content）・出題ロジック（lib/problems）・描画（components）** を分離しているので、
授業での試行結果を受けた調整の多くは `src/config/` だけで済む。

```
trigonometric_functions_pre/
├── README.md                    使い方・開発・公開手順
├── docs/
│   ├── SPEC.md                  企画・開発仕様書（v2）＋実装メモ
│   ├── ARCHITECTURE.md          このファイル
│   ├── firebase-setup.md        Firebase の準備手順
│   └── CHANGELOG.md             改訂履歴
├── .github/workflows/deploy.yml GitHub Pages への自動公開
├── firebase/firestore.rules     Firestore セキュリティルール
├── firebase.json                Firebase CLI 用（ルールのデプロイ）
├── public/                      アイコン・Service Worker（PWA）
├── tests/                       自動テスト（出題ロジック・スコア計算）
└── src/
    ├── config/                  ★ 調整用の設定値（ここを直すのが基本）
    │   ├── stages.ts            ステージ構成・山札（内訳＝ゴールの問題数）・θの範囲
    │   ├── game.ts              誤答ロック時間・到達判定の基準・ダッシュボード設定
    │   └── theme.ts             図の配色（強調色・対辺赤・隣辺青）
    ├── content/
    │   └── labels.ts            画面の日本語ラベル（出題パターン名・誤答集計の表示名）
    ├── lib/
    │   ├── problems/            ★ 出題ロジック（React に依存しない純粋関数）
    │   │   ├── types.ts         問題・図のデータ型
    │   │   ├── scenes.ts        図の「舞台」（平面・斜面・つるす・押す）
    │   │   ├── choices.ts       2択の選択肢（並び固定）
    │   │   ├── geometry.ts      ベクトル計算・鏡像反転
    │   │   ├── rng.ts           乱数（テスト用にシード固定可）
    │   │   ├── generators/
    │   │   │   ├── component.ts Stage 1〜3 成分選択
    │   │   │   └── tan.ts       発展モード
    │   │   └── index.ts         山札と generator の振り分け
    │   ├── scoring.ts           1プレイの集計・到達判定
    │   ├── dashboard.ts         ダッシュボードの集計
    │   ├── date.ts              日付キー・クラスコード正規化
    │   ├── format.ts            秒の表示形式
    │   ├── firebase/            Firebase 初期化と読み書き（ここ以外から Firestore を触らない）
    │   └── storage/local.ts     端末内保存（前回の自分との比較。ゲストの記録は別に保存）
    ├── hooks/useGame.ts         タイムアタックの進行（カウントダウン・経過時間・誤答ロック・ゴール判定）
    ├── components/
    │   ├── figure/FigureSvg.tsx 図の描画（問題の中身を知らない描画専用）
    │   ├── game/                生徒用画面の部品（プレイ・リザルト・復習）
    │   ├── dashboard/           教員用ダッシュボード
    │   └── ui/                  KaTeX・Service Worker 登録
    └── app/                     ルーティング（/ , /play/ , /dashboard/）
```

## データの流れ

```
config/stages.ts（deck）──▶ lib/problems（山札 → generator）──▶ Problem { figure, choices, correctId, statKey }
                                                       │
                           components/figure/FigureSvg ◀┘  （図を描く）
                           components/game/ChoiceGrid  ◀── （2択・並び固定）
                                     │ 回答
                                     ▼
                     hooks/useGame ──▶ AnswerLog[]（図つき）──▶ lib/scoring.summarize()
                                     │                             │
                     ResultScreen（間違えた問題の図・復習）  lib/storage/local ──▶ judgeMastery()（到達判定）
                                                                   │
                                           lib/firebase/repository（送信。図は送らない）──▶ dashboard
```

## よくある改訂と、直す場所

| やりたいこと | 直すファイル |
|---|---|
| ゴールの問題数を変える | `config/stages.ts` の `deck` の枚数（合計がそのままゴールになる） |
| 誤答ロックの長さを変える | `config/game.ts` の `wrongLockMs` |
| 到達判定の基準を変える | `config/game.ts` の `MASTERY`（回数・正答率・中央値） |
| 1 ラウンドの内訳を変える | `config/stages.ts` の `deck` |
| θ の範囲を変える | `config/stages.ts` の `thetaRange` |
| 選択肢の並び・表記を変える | `lib/problems/choices.ts` |
| 強調色・赤青の色を変える | `config/theme.ts` |
| 画面の文言・誤答パターンの表示名 | `content/labels.ts`、各画面部品 |
| 新しいステージを追加 | `config/stages.ts` に 1 件追加（既存 generator を使うなら他は不要） |
| 新しい図形パターンを追加 | `lib/problems/scenes.ts` に舞台を追加 → 該当 generator で使う → `types.ts` の `Pattern` と `labels.ts` に追記 |

改訂したら `npm test` を実行する。テストは
「山札の枚数＝ゴール・答えが半々」「斜面の θ は底角だけ」「2択・並び固定・F と mg を混ぜない」「基本モードに tan が混入しない」
「強調した矢印の長さ比が正解の式と一致する」
「適当押し（速いが不正確）は到達判定を通らない」などを確認している。

## データモデル（Firestore）

```
classes/{classCode}/days/{yyyymmdd}/results/{autoId}   1 プレイ 1 件（追記のみ）
  uid, name, stageId, clearMs（クリアタイム）, correct, total, accuracy,
  medianMs（正解時の反応時間の中央値）, mastered（到達判定を満たしたか）,
  patternStats { "S1:vertical:opposite": { n, wrong }, ... },  createdAt

classes/{classCode}/days/{yyyymmdd}/presence/{uid}     参加状況（heartbeat 30 秒）
  name, status（lobby / playing / done）, stageId, updatedAt
```

- 日付は日本時間で区切るので、「本日」のデータだけがダッシュボードに出る
- クラス・日ごとにコレクションを分けているため、複合インデックスは不要

### 誤答集計キー（statKey）

`{ステージID}:{図形パターン}:{詳細}` の形式。

- S1〜S3：詳細 = `opposite`（対辺）/ `adjacent`（隣辺）
- A1：詳細 = `horizontal`（mg tanθ）/ `oblique`（mg/cosθ）

表示名は `content/labels.ts` の `describeStatKey()` で変換する。
