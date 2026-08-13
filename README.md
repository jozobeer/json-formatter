# JSON整形・検証ツール

ブラウザ上で JSON を貼り付け、「整形」ボタン一発で 2 スペースインデントの読みやすい形式に変換する静的な単一ページツール。`JSON.parse` / `JSON.stringify` のみを使い、構文エラー時はエラーメッセージ（位置情報付き）を表示する。入力・出力は永続化せず、ページを開き直すと常に空の状態から始まる。

## 公開URL

https://json-formatter.jozo.beer

## 開発

[kojo](https://github.com/jozobeer/kojo)（1日1アプリ自動生成基盤）により生成されたリポジトリです。

初回セットアップ: `npm install`（Playwright ブラウザ未取得の環境では `npx playwright install chromium`）

- `npm test` — Playwright によるブラウザテスト
- `npm run verify` — 不変条件チェック（favicon / apps.jozo.beer フッター）
- `npm run deploy` — Cloudflare Workers へデプロイ

## 構成

- `public/index.html` — アプリ本体（CSS/JSインラインの単一ファイル）
- `tests/app.spec.ts` — 受け入れ条件に対応する Playwright テスト
- `PLAN.md` — 初回実装時の計画（歴史的文書。現状の正は README とテスト）
