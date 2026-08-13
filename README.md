# JSON整形・検証ツール

テキストエリアに貼り付けたJSON文字列を、ボタン一つで読みやすいインデント付きの整形済み表示に変換し、構文エラーがあればエラー箇所を知らせる静的な単一ページツール。

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
- `PLAN.md` — 受け入れ条件付きの実装計画
