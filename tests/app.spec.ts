import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";

// 静的アプリなのでサーバ不要。kojo の visualGate と同じ file:// 方式で開く
const APP_URL = pathToFileURL("public/index.html").href;

test("ページがロードできページエラーが出ない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(APP_URL);
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
});

// このスモークは削除しないこと。機能テストは PLAN.md の受け入れ条件ごとに追記する

test("AC1: 有効なJSONを整形すると2スペースインデントで表示される", async ({ page }) => {
  await page.goto(APP_URL);
  const input = '{"a":1,"b":[true,null]}';
  const expected = JSON.stringify(JSON.parse(input), null, 2);

  await page.locator("#input").fill(input);
  await page.locator("#format").click();

  await expect(page.locator("#output")).toHaveText(expected);
  await expect(page.locator("#error")).toBeHidden();
});

test("AC2: 不正なJSONでは構文エラーと位置情報が表示され出力は消える", async ({ page }) => {
  await page.goto(APP_URL);

  await page.locator("#input").fill('{"a":1,"b":[true,null]}');
  await page.locator("#format").click();
  await expect(page.locator("#output")).not.toBeEmpty();

  await page.locator("#input").fill('{"a":1,}');
  await page.locator("#format").click();

  const error = page.locator("#error");
  await expect(error).toBeVisible();
  const errorText = await error.innerText();
  expect(errorText).toContain("構文エラー");
  expect(errorText).toMatch(/position|line|column|行|列/i);
  await expect(page.locator("#output")).toHaveText("");
});

test("AC3: 空白のみの入力では案内メッセージが表示される", async ({ page }) => {
  await page.goto(APP_URL);

  await page.locator("#input").fill("   ");
  await page.locator("#format").click();

  await expect(page.locator("#error")).toContainText("JSONを入力してください");
  await expect(page.locator("#output")).toHaveText("");
});

test("AC4: 再読み込み後は初期状態で永続化されない", async ({ page }) => {
  await page.goto(APP_URL);

  await page.locator("#input").fill('{"a":1}');
  await page.locator("#format").click();
  await expect(page.locator("#output")).not.toBeEmpty();

  await page.reload();

  await expect(page.locator("#input")).toHaveValue("");
  await expect(page.locator("#output")).toHaveText("");
  await expect(page.locator("#error")).toHaveText("");

  const storage = await page.evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
  }));
  expect(storage.local).toBe(0);
  expect(storage.session).toBe(0);
});
