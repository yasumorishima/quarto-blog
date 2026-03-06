/**
 * generate-table-images.js
 *
 * note/*.md 内の Markdown 表を全て検出し、
 * スタイル付き PNG 画像として note/tables/ に保存する。
 *
 * 使い方:
 *   node note/generate-table-images.js            # 全ファイル処理
 *   node note/generate-table-images.js foo.md     # 指定ファイルのみ
 *
 * 出力: note/tables/<basename>-t<n>.png
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const NOTE_DIR = __dirname;
const TABLES_DIR = path.join(NOTE_DIR, "tables");

if (!fs.existsSync(TABLES_DIR)) {
  fs.mkdirSync(TABLES_DIR, { recursive: true });
}

// Markdown 表を HTML に変換
function tableToHtml(tableLines) {
  const rows = tableLines
    .filter(line => !line.trim().match(/^\|[\s\-:|]+\|$/)) // セパレータ除外
    .map(line =>
      line.split("|").slice(1, -1).map(cell => cell.trim())
    );

  if (rows.length === 0) return null;

  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 20px; background: white; font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; }
  table { border-collapse: collapse; font-size: 15px; width: auto; min-width: 300px; }
  th { background: #2d3748; color: white; padding: 10px 20px; text-align: center; font-weight: 600; white-space: nowrap; }
  td { padding: 9px 20px; border-bottom: 1px solid #e2e8f0; text-align: center; white-space: nowrap; }
  tr:nth-child(even) td { background: #f7fafc; }
</style></head><body><table>
<thead><tr>${headerRow.map(c => `<th>${c}</th>`).join("")}</tr></thead>
<tbody>${bodyRows.map(row =>
    `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`
  ).join("")}</tbody>
</table></body></html>`;
}

// MD ファイルから全表を抽出 → { tableLines, index } の配列
function extractTables(mdContent) {
  const lines = mdContent.split("\n");
  const tables = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim().startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      tables.push(tableLines);
    } else {
      i++;
    }
  }

  return tables;
}

async function processFile(browser, mdPath) {
  const basename = path.basename(mdPath, ".md");
  const content = fs.readFileSync(mdPath, "utf-8");
  const tables = extractTables(content);

  if (tables.length === 0) {
    console.log(`  ${basename}: no tables`);
    return [];
  }

  const generated = [];

  for (let n = 0; n < tables.length; n++) {
    const outPath = path.join(TABLES_DIR, `${basename}-t${n + 1}.png`);
    const html = tableToHtml(tables[n]);
    if (!html) continue;

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    const table = await page.$("table");
    await table.screenshot({ path: outPath });
    await page.close();

    console.log(`  ${basename}-t${n + 1}.png (${tables[n].length} rows)`);
    generated.push(outPath);
  }

  return generated;
}

(async () => {
  // 対象ファイルを決定
  const targetArg = process.argv[2];
  let mdFiles;

  if (targetArg) {
    const p = path.isAbsolute(targetArg)
      ? targetArg
      : path.resolve(NOTE_DIR, targetArg);
    mdFiles = [p];
  } else {
    mdFiles = fs.readdirSync(NOTE_DIR)
      .filter(f => f.endsWith(".md"))
      .map(f => path.join(NOTE_DIR, f));
  }

  console.log(`Processing ${mdFiles.length} file(s)...`);

  const browser = await chromium.launch({ headless: true });

  for (const mdPath of mdFiles) {
    await processFile(browser, mdPath);
  }

  await browser.close();
  console.log(`\nDone. Images saved to: note/tables/`);
})();
