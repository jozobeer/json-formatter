# PLAN: JSON整形・検証ツール

## 1. 概要

テキストエリアに貼り付けたJSON文字列を、ボタン一つで2スペースインデントの整形済みテキストに変換して表示する静的な単一ページツールを作る。構文エラーを含む入力に対しては、エラーである旨とエラー位置の手がかり（`JSON.parse` のエラーメッセージ）を表示する。状態は一切永続化せず、ページを開き直すと常に空の状態から始まる。`public/index.html` 単一ファイル（CSS/JSインライン）で完結し、ビルドなし・外部依存なし。

## 2. 意図（明示）

APIレスポンスや設定ファイルの中身をすぐに見やすく整形して確認したい開発者が、その場で貼り付けるだけで使う。

## 3. 受け入れ条件

- [ ] AC1: 有効なJSON（例: `{"a":1,"b":[true,null]}`）を入力欄に貼り付けて「整形」ボタンを押すと、出力欄に2スペースインデントの整形済みJSONが表示される
- [ ] AC2: 不正なJSON（例: `{"a":1,}`）を入力して整形を実行すると、出力欄ではなくエラー表示領域に、エラーである旨と `JSON.parse` が返す位置情報を含むメッセージが表示される（出力欄に前回の整形結果が残らない）
- [ ] AC3: 空文字（または空白のみ）の入力で整形を実行すると、「JSONを入力してください」という案内メッセージが表示され、整形結果は表示されない
- [ ] AC4: 整形結果を表示した後にページを再読み込みすると、入力欄・出力欄・エラー表示がすべて空の初期状態に戻る（localStorage / sessionStorage への保存を行わない）

## 4. 実装方針

- **ファイル構成**: `public/index.html` のみを変更。CSS は `<style>`、JS は `<script>` にインライン記述。フレームワーク・ライブラリなし。
- **レイアウト**: 縦一列の通常フロー。上から「タイトル＋説明1行」「入力用 `<textarea id="input">`」「`<button id="format">整形</button>`」「エラー表示 `<p id="error" role="alert">`（デフォルト非表示）」「出力用 `<pre id="output">`」「AGENTS.md 指定のフッター（`</body>` 直前、body はセンタリング flex にしない）」。
- **主要関数**:
  - `formatJson()`: ボタンの click ハンドラ。入力値を `trim()` して空なら案内メッセージを表示。それ以外は `JSON.parse` → `JSON.stringify(value, null, 2)` の結果を `#output` の `textContent` に設定。`SyntaxError` を catch したら `#output` をクリアし、`#error` に「JSONの構文エラー: <e.message>」を表示。成功時は `#error` をクリア。
  - 状態管理は DOM のみ。`localStorage` / `sessionStorage` は一切使わない。
- **XSS対策**: 出力・エラーとも `textContent` で代入し、`innerHTML` は使わない。
- **favicon**: `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI（波括弧 `{}` をモチーフにした絵柄）。
- **スコープ外**: コピー機能・インデント幅切替・シンタックスハイライト・キーソートは実装しない（1日で確実に完成させるため機能を最小に保つ）。

## 5. テスト計画

`tests/app.spec.ts` に追記する（既存スモークテストは残す）。すべて Playwright の実ブラウザ（既定の Chromium）で `pathToFileURL("public/index.html")` を開き、`fill` → `click` の実操作で駆動し、画面に表示される実値まで直接検証する。時刻・回数・並行操作に依存する機能はないため、時刻制御は不要。

- **T1（AC1対応）**: `#input` に `{"a":1,"b":[true,null]}` を fill し、`#format` を click。`#output` のテキストが厳密に `{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}`（`JSON.stringify(JSON.parse(入力), null, 2)` と同一の実値）であることを検証。あわせて `#error` が非表示であることを検証。
- **T2（AC2対応）**: まず T1 と同じ有効JSONで整形して出力を表示させた後、`#input` を `{"a":1,}` に fill して click。`#error` が可視で、テキストに「構文エラー」と位置情報（`position` または行/列を示す部分文字列。Chromium の `JSON.parse` エラーメッセージに含まれる）の両方を含むことを検証。さらに `#output` が空（前回の整形結果が消えている）ことを検証。
- **T3（AC3対応）**: `#input` に `"   "`（空白のみ）を fill して click。「JSONを入力してください」が表示され、`#output` が空であることを検証。境界: 空白のみの入力は「空」として扱う（`trim()` 後に判定）ことをこのテストで確定する。
- **T4（AC4対応）**: 有効JSONを整形して `#output` に実値が表示されたことを確認した後、`page.reload()`。リロード後に `#input` の value・`#output` のテキスト・`#error` がすべて空であることを検証。加えて `page.evaluate` で `localStorage.length === 0` かつ `sessionStorage.length === 0` を検証し、永続化を行っていないことを直接確認する。
