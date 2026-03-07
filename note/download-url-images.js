/**
 * download-url-images.js
 *
 * note/*.md 内の ![alt](https://...) 画像URLを検出し、
 * note/images/ にダウンロードする。
 *
 * 使い方:
 *   node note/download-url-images.js            # 全mdファイル処理
 *   node note/download-url-images.js foo.md     # 指定ファイルのみ
 *
 * 出力: note/images/<url-basename>
 * note-post.js が URL画像を貼る際に note/images/ を参照する。
 */

const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

const NOTE_DIR = __dirname;
const IMAGES_DIR = path.join(NOTE_DIR, "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function extractUrlImages(mdContent) {
  const regex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const images = [];
  let match;
  while ((match = regex.exec(mdContent)) !== null) {
    images.push({ alt: match[1], url: match[2] });
  }
  return images;
}

function download(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { headers: { "User-Agent": "note-image-downloader" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function processFile(mdPath) {
  const basename = path.basename(mdPath, ".md");
  const content = fs.readFileSync(mdPath, "utf-8");
  const images = extractUrlImages(content);

  if (images.length === 0) {
    console.log(`  ${basename}: no URL images`);
    return [];
  }

  const downloaded = [];
  for (const img of images) {
    const filename = path.basename(new URL(img.url).pathname);
    const outPath = path.join(IMAGES_DIR, filename);

    if (fs.existsSync(outPath)) {
      console.log(`  ${basename}: ${filename} (already exists, skipping)`);
      downloaded.push(outPath);
      continue;
    }

    try {
      console.log(`  ${basename}: downloading ${filename}...`);
      const data = await download(img.url);
      fs.writeFileSync(outPath, data);
      console.log(`  ${basename}: ${filename} (${(data.length / 1024).toFixed(0)} KB)`);
      downloaded.push(outPath);
    } catch (err) {
      console.error(`  ${basename}: FAILED ${filename} - ${err.message}`);
    }
  }

  return downloaded;
}

(async () => {
  const targetArg = process.argv[2];
  let mdFiles;

  if (targetArg) {
    const p = path.isAbsolute(targetArg)
      ? targetArg
      : path.resolve(NOTE_DIR, targetArg);
    mdFiles = [p];
  } else {
    mdFiles = fs.readdirSync(NOTE_DIR)
      .filter(f => f.endsWith(".md") && f !== "README.md")
      .map(f => path.join(NOTE_DIR, f));
  }

  console.log(`Processing ${mdFiles.length} file(s)...`);

  for (const mdPath of mdFiles) {
    await processFile(mdPath);
  }

  console.log(`\nDone. Images saved to: note/images/`);
})();
