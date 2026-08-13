# JSON整形・検証ツール

静的な単一ページの JSON 整形・検証ツール。`public/index.html` に CSS/JS をインラインで完結させ、Cloudflare Workers assets で配信する。

## アプリ概要と構成

- 入力: `#input`（textarea）に JSON 文字列を貼り付け、「整形」(`#format`) で処理する
- 成功時: `JSON.parse` → `JSON.stringify(value, null, 2)` の結果を `#output`（`<pre>`）に表示。`#error` は非表示
- 構文エラー時: `#output` を空にし、`#error` に「JSONの構文エラー:」＋ `JSON.parse` のメッセージ（位置情報を含む）を表示
- 空入力（空白のみ含む）: 「JSONを入力してください」を表示し、出力は出さない
- 永続化なし: `localStorage` / `sessionStorage` を使わない。再読み込みで入力・出力・エラーはすべて空に戻る
- XSS対策: 出力・エラーとも `textContent` で代入（`innerHTML` は使わない）
- ファイル: 変更対象は主に `public/index.html` と `tests/app.spec.ts`
- 挙動の正: README の説明と `tests/app.spec.ts`（スモークテストは削除しない）

## 技術スタック（不変）

- バニラJS・単一 `public/index.html`（CSS/JSインライン）・ビルドなし
- 配信: Cloudflare Workers assets（`wrangler.jsonc`）
- テスト: Playwright（`tests/app.spec.ts`、`npm test`）
- 保守時もこのスタックを維持すること。フレームワーク・ビルドツール・宣言外ライブラリの導入は禁止

## 品質不変条件

- favicon は `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI を維持する（外部ファイル・外部URL不可）
- フッターに `https://apps.jozo.beer` へのリンク（テキスト `apps.jozo.beer`）を維持する。スタイルはテーマに合わせてよいがリンク先・テキストは変えない
- `public/` に独立した `.js` / `.css` を置かない（単一ファイル構成）
- 変更後は `npm run verify` が通る状態を維持する

## 保守の進め方

1. 変更前に受け入れ条件を `tests/app.spec.ts` のテストにする（既存スモークは残す）
2. 実装する（スタック制約・品質不変条件を守る）
3. `npm test` で通す（必要なら `npm run verify` も）
4. `git commit` & `git push`
5. `npm run deploy`

## PLAN.md について

`PLAN.md` は初回実装時の計画（歴史的文書）である。現状の正は README と `tests/app.spec.ts` であり、PLAN を更新して仕様の正とする必要はない。
