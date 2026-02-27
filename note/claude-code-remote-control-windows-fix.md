# Windows で claude remote-control が「Workspace not trusted」になったときの直し方

## 何が起きた？

Claude Code に Remote Control という機能が追加されました（2026年2月25日リリース）。スマホから手元の PC の Claude Code を操作できる機能です。

使おうとしたら、こんなエラーが出ました。

```
Error: Workspace not trusted. Please run `claude` in C:\Users\<username> first to review and accept the workspace trust dialog.
```

「え、今まさに claude 使ってるじゃん」という状態です。

## 原因

`C:\Users\<username>\.claude.json` というファイルの中に、こんな行がありました。

```json
"hasTrustDialogAccepted": false
```

普通の claude コマンドはこのフラグをチェックしない。でも `claude remote-control` は起動時に必ずチェックする。なので、何百回も claude を使ってきたのに `false` のまま、という状態になっていました。

## 直し方

`C:\Users\<username>\.claude.json` をテキストエディタで開いて、`hasTrustDialogAccepted` を `false` から `true` に書き換えるだけです。

**注意：** Windows だと同じフォルダのパスが「バックスラッシュ版（`C:\\Users\\<username>`）」と「スラッシュ版（`C:/Users/<username>`）」の2つ記録されていることがあります。実際にチェックされているのはスラッシュ版ですが、両方直しておくと安全です。

変更前：

```json
"C:/Users/<username>": {
  "hasTrustDialogAccepted": false
}
```

変更後：

```json
"C:/Users/<username>": {
  "hasTrustDialogAccepted": true
}
```

## 直したら動いた

```
·✔︎· Connected · <username> · HEAD
Continue coding in the Claude app or https://claude.ai/code/session_...
space to show QR code
```

このURLをスマホで開けばつながります。スペースキーでQRコードも出るはずですが、Windows CMD だと反応しないことがあるのでその場合はURLを直接使ってください。

---

Remote Control、スマホから PC の作業を継続できてかなり便利そうです。
