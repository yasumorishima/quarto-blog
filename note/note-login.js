const path = require("path");

async function getChromium() {
  try {
    return require("playwright").chromium;
  } catch {
    // npx経由で実行された場合
    return require("playwright-core").chromium;
  }
}

const STORAGE_PATH = path.join(__dirname, "note-auth.json");

(async () => {
  const chromium = await getChromium();
  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",  // システムのChromeを使う
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://note.com/login");

  console.log("=== noteのログインページを開きました ===");
  console.log("ブラウザで手動でログインしてください。");
  console.log("ログイン完了後、自動的にcookieを保存して終了します。");

  // ログイン後にダッシュボードやトップに遷移するのを待つ
  await page.waitForURL((url) => {
    const u = url.toString();
    return u === "https://note.com/" || u.startsWith("https://note.com/dashboard");
  }, { timeout: 300000 }); // 5分待つ

  // cookieを保存
  await context.storageState({ path: STORAGE_PATH });
  console.log(`\ncookieを保存しました: ${STORAGE_PATH}`);
  console.log("ブラウザを閉じます...");

  await browser.close();
})();
