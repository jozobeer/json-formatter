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

function collectJsonLdNodes(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    return parsed.flatMap(collectJsonLdNodes);
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const nested = obj["@graph"];
    if (nested) return collectJsonLdNodes(nested);
    return [obj];
  }
  return [];
}

function typeIncludes(node: Record<string, unknown>, type: string): boolean {
  const t = node["@type"];
  return t === type || (Array.isArray(t) && t.includes(type));
}

test("SEO: meta description が空でなく存在する", async ({ page }) => {
  await page.goto(APP_URL);
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute("content", /.+/);
});

test("SEO: JSON-LD に WebApplication の必須フィールドがある", async ({ page }) => {
  await page.goto(APP_URL);
  const scripts = page.locator('script[type="application/ld+json"]');
  await expect(scripts).not.toHaveCount(0);

  const texts = await scripts.allTextContents();
  const nodes = texts.flatMap((text) => collectJsonLdNodes(JSON.parse(text)));
  const app = nodes.find((node) => typeIncludes(node, "WebApplication"));

  expect(app).toBeTruthy();
  expect(String(app?.name ?? "").trim()).not.toBe("");
  expect(String(app?.description ?? "").trim()).not.toBe("");
  expect(String(app?.url ?? "").trim()).not.toBe("");
  expect(String(app?.applicationCategory ?? "").trim()).not.toBe("");

  const offers = app?.offers as Record<string, unknown> | undefined;
  expect(String(offers?.price ?? "")).toBe("0");
});

test("SEO: 使い方とFAQのセクションが存在する", async ({ page }) => {
  await page.goto(APP_URL);
  await expect(page.getByRole("heading", { name: "使い方" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
});
