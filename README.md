# ベクトル分解タイムトライアル（Vector Breakout）

高1物理基礎向けの **超高速ベクトル成分分解トレーニング**。授業冒頭 1〜3 分の帯活動として、
「図の見た目 → 成分（数式）」の変換を反射レベルまで自動化させることを狙う。

- 生徒用：`/play/` … クラスコード＋出席番号で参加 → 12 問正解でゴールのタイムアタック → リザルト（間違えた問題の図つき）
- 教員用：`/dashboard/` … 参加人数・平均正答率・タイム TOP5・到達者数・誤答率の高い出題パターンをリアルタイム投影

仕様書は [docs/SPEC.md](docs/SPEC.md)、フォルダ構成と改訂の手順は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

---

## ステージ

| ID | 名前 | 内容 |
|---|---|---|
| S0 | 角度認識 | 光っている角が θ か 90°−θ か |
| S1 | 平面分解 | 水平・鉛直パターンで Fsinθ か Fcosθ か |
| S2 | 斜面分解 | 斜面上の重力で mgsinθ か mgcosθ か（物体側にも θ を表示） |
| S3 | ランダム | 全パターン混合（斜面は底角の θ だけ表示） |
| A1 | 発展 | 3 力のつり合いで mg tanθ か mg/cosθ か |

- すべて 2 択・並び固定（左 sin・右 cos）。12 問正解でゴール、まちがえると 1.5 秒ストップ
- 到達判定：直近 3 回で正答率 95%以上 かつ 正解時の反応時間の中央値 1.0 秒以下

## 授業での使い方（URL で固定できる）

```
https://shin-phys.github.io/trigonometric_functions_pre/play/?class=1A&stage=S1
https://shin-phys.github.io/trigonometric_functions_pre/dashboard/?class=1A
```

- `class` … クラスコード（入力済みの状態で開く）
- `stage` … `S0`〜`S3`, `A1`（指定するとステージ選択を飛ばして開始）
- ダッシュボードに `&demo=1` を付けると見本データで表示（Firebase なしで確認用）

PC では キー `←` `→`（または `1` `2`、`F` `J`）でも回答できる。

---

## 開発

```bash
npm install
cp .env.example .env.local   # Firebase を使う場合のみ値を記入
npm run dev                  # http://localhost:3000
npm test                     # 出題ロジック・スコア計算のテスト
npm run build                # out/ に静的サイトを出力
```

Firebase を設定しなくても「ローカルモード」で動く（記録は端末内のみ、ダッシュボードは受信しない）。
Firebase の準備は [docs/firebase-setup.md](docs/firebase-setup.md)。

## 公開（GitHub Pages）

`main` に push すると GitHub Actions（`.github/workflows/deploy.yml`）が テスト → ビルド → 公開 を行う。

初回だけ：

1. リポジトリの **Settings → Pages → Source** を **GitHub Actions** にする
2. Firebase を使う場合は **Settings → Secrets and variables → Actions → Variables** に
   `NEXT_PUBLIC_FIREBASE_*` の 6 つを登録（[docs/firebase-setup.md](docs/firebase-setup.md)）

### 改訂を公開する

```bash
npm test
git add .
git commit -m "変更内容を一言で"
git push
```

## 技術スタック

Next.js（App Router・静的エクスポート）/ React / TypeScript / Tailwind CSS / KaTeX /
Firebase（Cloud Firestore・Anonymous Auth）/ Vitest
