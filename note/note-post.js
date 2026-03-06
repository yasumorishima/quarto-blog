const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const STORAGE_PATH = path.join(__dirname, "note-auth.json");

// コマンドライン引数からMarkdownファイルを取得
const mdFile = process.argv[2];
if (!mdFile) {
  console.error("Usage: node note-post.js <markdown-file>");
  console.error("Example: node note-post.js npb-prediction-marcel-vs-ml.md");
  process.exit(1);
}

const mdPath = path.resolve(mdFile);
if (!fs.existsSync(mdPath)) {
  console.error(`File not found: ${mdPath}`);
  process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, "utf-8");
const mdDir = path.dirname(mdPath);

// Markdownをパースしてブロック単位に分割
function parseMd(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行はスキップ
    if (line.trim() === "") {
      i++;
      continue;
    }

    // H1 = タイトル（最初の1つだけ）
    if (line.startsWith("# ")) {
      blocks.push({ type: "title", text: line.replace(/^# /, "") });
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.replace(/^## /, "") });
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.replace(/^### /, "") });
      i++;
      continue;
    }

    // 水平線
    if (line.trim() === "---") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 画像 ![alt](path)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      blocks.push({ type: "image", alt: imgMatch[1], src: imgMatch[2] });
      i++;
      continue;
    }

    // 表（| で始まる行が連続する）
    if (line.trim().startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    // 引用ブロック（連続する > 行をまとめる）
    if (line.startsWith("> ") || line === ">") {
      let quoteLines = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        quoteLines.push(lines[i].replace(/^> ?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: quoteLines.join("\n") });
      continue;
    }

    // リスト項目
    if (line.match(/^[-*] /)) {
      blocks.push({ type: "list-item", text: line.replace(/^[-*] /, "") });
      i++;
      continue;
    }

    // 通常の段落（連続する非空行をまとめる）
    let paraLines = [];
    while (i < lines.length && lines[i].trim() !== "" &&
           !lines[i].startsWith("#") && !lines[i].startsWith("> ") &&
           !lines[i].match(/^[-*] /) && lines[i].trim() !== "---" &&
           !lines[i].trim().startsWith("|") && !lines[i].match(/^!\[/)) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join("\n") });
    }
  }

  return blocks;
}

// Markdown表をHTMLに変換
function tableToHtml(tableLines) {
  const rows = tableLines
    .filter(line => !line.match(/^\|[\s-:|]+\|$/)) // セパレータ行を除外
    .map(line =>
      line.split("|").slice(1, -1).map(cell => cell.trim())
    );

  if (rows.length === 0) return "";

  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 16px; background: white; font-family: 'Segoe UI', 'Hiragino Sans', sans-serif; }
  table { border-collapse: collapse; font-size: 15px; width: auto; }
  th { background: #2d3748; color: white; padding: 10px 16px; text-align: left; font-weight: 600; }
  td { padding: 8px 16px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f7fafc; }
  tr:hover { background: #edf2f7; }
</style></head><body><table>`;

  html += "<thead><tr>" + headerRow.map(c => `<th>${c}</th>`).join("") + "</tr></thead>";
  html += "<tbody>" + bodyRows.map(row =>
    "<tr>" + row.map(c => `<td>${c}</td>`).join("") + "</tr>"
  ).join("") + "</tbody>";
  html += "</table></body></html>";

  return html;
}

// 表をHTMLで描画してスクリーンショットを撮る
async function tableToImage(browser, tableLines) {
  const html = tableToHtml(tableLines);
  const tempPage = await browser.newPage();
  await tempPage.setContent(html);
  await tempPage.waitForTimeout(500);

  // テーブル要素のサイズに合わせてスクリーンショット
  const table = await tempPage.$("table");
  const imgPath = path.join(__dirname, `_table_${Date.now()}.png`);
  await table.screenshot({ path: imgPath });
  await tempPage.close();
  return imgPath;
}

// noteエディタに画像をクリップボード経由でペースト
async function uploadImage(page, imagePath) {
  // エディタにフォーカスを戻して空行を確保
  await page.click(".ProseMirror", { force: true });
  await page.waitForTimeout(500);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);

  // 画像ファイルをbase64に変換してクリップボードに書き込む
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).slice(1).toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";

  await page.evaluate(async ({ base64, mimeType }) => {
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArr[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArr], { type: mimeType });
    const item = new ClipboardItem({ [mimeType]: blob });
    await navigator.clipboard.write([item]);
  }, { base64, mimeType });

  console.log(`  -> Clipboard set: ${path.basename(imagePath)}`);

  // Ctrl+V でペースト
  await page.keyboard.press("Control+v");
  await page.waitForTimeout(3000);

  // クロップモーダルの「保存」ボタンを押す（出た場合）
  try {
    const saveBtn = page.locator('.ReactModalPortal button:has-text("保存")');
    const visible = await saveBtn.isVisible().catch(() => false);
    if (visible) {
      await page.waitForTimeout(1500);
      console.log(`  -> Clicking crop save button`);
      await saveBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }
  } catch {
    // モーダルがなければスキップ
  }

  console.log(`  -> Image pasted: ${path.basename(imagePath)}`);
  return true;
}

// Markdownのインライン書式を処理して入力するヘルパー
async function typeWithFormatting(page, text) {
  // **太字** を処理
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      await page.keyboard.down("Control");
      await page.keyboard.press("b");
      await page.keyboard.up("Control");
      await page.keyboard.type(boldText, { delay: 10 });
      await page.keyboard.down("Control");
      await page.keyboard.press("b");
      await page.keyboard.up("Control");
    } else if (part) {
      await page.keyboard.type(part, { delay: 10 });
    }
  }
}

(async () => {
  const blocks = parseMd(mdContent);
  const titleBlock = blocks.find(b => b.type === "title");
  const bodyBlocks = blocks.filter(b => b.type !== "title");

  if (!titleBlock) {
    console.error("Error: No H1 title found in markdown");
    process.exit(1);
  }

  // 一時画像ファイルのクリーンアップ用
  const tempFiles = [];

  console.log(`Title: ${titleBlock.text}`);
  console.log(`Body blocks: ${bodyBlocks.length}`);
  console.log("---");

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
  });
  const context = await browser.newContext({
    storageState: STORAGE_PATH,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  await page.goto("https://note.com/notes/new");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // タイトル入力
  console.log("Entering title...");
  const titleArea = await page.waitForSelector('textarea[placeholder="記事タイトル"]');
  await titleArea.click();
  await titleArea.fill(titleBlock.text);

  // 本文エディタにフォーカス
  console.log("Entering body...");
  const editor = await page.waitForSelector(".ProseMirror");
  await editor.click();

  for (let i = 0; i < bodyBlocks.length; i++) {
    const block = bodyBlocks[i];
    const progress = `[${i + 1}/${bodyBlocks.length}]`;

    switch (block.type) {
      case "h2":
        console.log(`${progress} H2: ${block.text.substring(0, 40)}`);
        await typeWithFormatting(page, block.text);
        await page.keyboard.press("Home");
        await page.keyboard.down("Shift");
        await page.keyboard.press("End");
        await page.keyboard.up("Shift");
        await page.keyboard.press("Enter");
        break;

      case "h3":
        console.log(`${progress} H3: ${block.text.substring(0, 40)}`);
        await typeWithFormatting(page, block.text);
        await page.keyboard.press("Enter");
        break;

      case "hr":
        console.log(`${progress} --- (horizontal rule)`);
        await page.keyboard.type("---");
        await page.keyboard.press("Enter");
        break;

      case "image": {
        console.log(`${progress} Image: ${block.src}`);
        // 画像パスを解決（相対パスならmdファイルのディレクトリ基準）
        let imgPath = block.src;
        if (!path.isAbsolute(imgPath) && !imgPath.startsWith("http")) {
          imgPath = path.resolve(mdDir, imgPath);
        }
        if (imgPath.startsWith("http")) {
          console.log(`  -> URL image not supported yet, skipping: ${imgPath}`);
        } else if (fs.existsSync(imgPath)) {
          await uploadImage(page, imgPath);
          // アップロード後エディタにフォーカスを戻す
          await page.click(".ProseMirror", { force: true });
          await page.waitForTimeout(500);
          await page.keyboard.press("End");
        } else {
          console.log(`  -> File not found: ${imgPath}`);
        }
        break;
      }

      case "table": {
        // note/tables/ に事前生成画像があれば優先使用、なければその場で生成
        const basename = path.basename(mdPath, ".md");
        const tableIndex = bodyBlocks.slice(0, i).filter(b => b.type === "table").length + 1;
        const preGenPath = path.join(__dirname, "tables", `${basename}-t${tableIndex}.png`);

        let tableImgPath;
        if (fs.existsSync(preGenPath)) {
          console.log(`${progress} Table -> using pre-generated: ${path.basename(preGenPath)}`);
          tableImgPath = preGenPath;
        } else {
          console.log(`${progress} Table (${block.lines.length} rows) -> generating image`);
          tableImgPath = await tableToImage(browser, block.lines);
          tempFiles.push(tableImgPath);
        }

        await uploadImage(page, tableImgPath);
        await page.click(".ProseMirror");
        await page.keyboard.press("End");
        break;
      }

      case "quote":
        console.log(`${progress} Quote: ${block.text.substring(0, 40)}...`);
        const quoteLines = block.text.split("\n");
        for (const ql of quoteLines) {
          await typeWithFormatting(page, ql);
          await page.keyboard.press("Enter");
        }
        await page.keyboard.press("Enter");
        break;

      case "list-item":
        console.log(`${progress} List: ${block.text.substring(0, 40)}`);
        await page.keyboard.type("- ");
        await typeWithFormatting(page, block.text);
        await page.keyboard.press("Enter");
        break;

      case "paragraph":
        console.log(`${progress} Paragraph: ${block.text.substring(0, 40)}...`);
        await typeWithFormatting(page, block.text);
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
        break;

      default:
        console.log(`${progress} Unknown: ${block.type}`);
    }

    await page.waitForTimeout(100);
  }

  console.log("\n=== 入力完了 ===");
  console.log("ブラウザで内容を確認してください。");

  // --no-wait フラグがあれば30秒後に自動終了、なければEnter待ち
  if (process.argv.includes("--no-wait")) {
    console.log("30秒後に自動でブラウザを閉じます...");
    await new Promise(resolve => setTimeout(resolve, 30000));
  } else {
    console.log("問題なければ手動で「公開」または「下書き保存」してください。");
    console.log("Enterキーを押すとブラウザを閉じます。");
    await new Promise(resolve => {
      process.stdin.once("data", resolve);
    });
  }

  // 一時ファイルのクリーンアップ
  for (const f of tempFiles) {
    try { fs.unlinkSync(f); } catch {}
  }

  await browser.close();
})();
