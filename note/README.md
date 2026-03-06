# note 自動投稿ワークフロー（Playwright）

Markdown ファイルを note.com に自動投稿するスクリプト群。

## スクリプト

| ファイル | 用途 |
|---|---|
| `note-login.js` | 手動ログイン → cookie 保存（初回のみ） |
| `note-post.js` | MD → note.com 自動投稿 |
| `generate-table-images.js` | MD 内の表を PNG 画像に変換（GitHub Actions でも自動実行） |

## セットアップ（初回のみ）

```bash
cd note/
npm install playwright
npx playwright install chromium
node note-login.js   # ブラウザが開く → 手動ログイン → cookie 自動保存
```

## 記事投稿

```bash
node note-post.js <記事>.md
```

1. Chrome が開いてタイトル・本文が自動入力される
2. 内容を確認して手動で「公開」または「下書き保存」
3. ターミナルで Enter → 終了

`--no-wait` をつけると 30 秒後に自動終了。

## 表 → 画像の自動生成（GitHub Actions）

`note/*.md` を push すると `.github/workflows/generate-note-tables.yml` が起動し、
Markdown 表を `note/tables/<basename>-t<n>.png` に自動変換してコミットバックする。

`note-post.js` は `note/tables/` の画像を優先使用するので、push 後に `git pull` してから投稿すると高速。

## ハマりポイント・注意事項

### 画像挿入はクリップボードペースト方式のみ動作する
`button[aria-label="画像を追加"]` 経由のファイル選択ダイアログは **1枚目は動くが2枚目以降で filechooser イベントが発火しない**。
`navigator.clipboard.write()` → `Ctrl+V` のクリップボード方式が唯一安定する。

### クリップボード権限を必ず付与する
```js
const context = await browser.newContext({
  storageState: STORAGE_PATH,
  permissions: ["clipboard-read", "clipboard-write"],  // ← 必須
});
```
これがないと `navigator.clipboard.write()` が Permission denied で落ちる。

### 画像アップロード後にクロップモーダルが出る
`.ReactModalPortal button:has-text("保存")` を押してモーダルを閉じないと、
次の操作（`.ProseMirror` クリック）がブロックされてタイムアウトする。

### システム Chrome を使う（headless shell では動かない）
```js
const browser = await chromium.launch({
  headless: false,
  channel: "chrome",  // システムの Chrome を使う
});
```
`npx playwright install chromium` でインストールされるのは headless shell のみ。
GUI が必要なので `channel: "chrome"` でシステム Chrome を指定する。

### cookie の期限切れ
`note-auth.json` の cookie が切れたら `node note-login.js` で再ログインするだけ。

### セキュリティ
`note-auth.json` は `.gitignore` 済み。**絶対にコミットしないこと。**
