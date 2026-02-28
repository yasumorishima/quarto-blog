---
title: Fix "Workspace not trusted" Error for Claude Code remote-control on Windows
published: false
description: How to fix the workspace trust error when running claude remote-control on Windows by editing .claude.json directly.
tags: claudecode, windows, ai, tutorial
canonical_url: https://zenn.dev/shogaku/articles/claude-code-remote-control-windows-fix
---

## Overview

Anthropic released the **Remote Control** feature for Claude Code on February 25, 2026 — letting you continue a local Claude Code session from your phone or any browser.

On Windows, you may run into this error immediately:

```
Error: Workspace not trusted. Please run `claude` in C:\Users\<username> first to review and accept the workspace trust dialog.
```

Even if you've been using `claude` interactively for months. Here's why it happens and how to fix it.

## Requirements

Before troubleshooting, confirm:

- **Max plan subscription** (Pro support coming soon)
- Authenticated via `claude.ai` (not API key) — check with `claude auth status`

## Root Cause

Inside `~/.claude.json`, Claude Code stores a per-project trust flag:

```json
"C:/Users/<username>": {
  ...
  "hasTrustDialogAccepted": false,
  ...
}
```

Regular `claude` sessions don't check this flag. But `claude remote-control` checks it strictly before starting. Even after hundreds of normal sessions, if the flag is `false`, the command fails.

## Fix

Edit `~/.claude.json` directly (located at `C:\Users\<username>\.claude.json`).

### Important: Two path formats

On Windows, `.claude.json` may contain two entries for the same directory:

- Backslash format: `"C:\\Users\\<username>"`
- Forward slash format: `"C:/Users/<username>"`

The `remote-control` command checks the **forward slash** version. Update both to be safe.

Find both entries and change `"hasTrustDialogAccepted": false` to `"hasTrustDialogAccepted": true`.

**Before:**

```json
"C:/Users/<username>": {
  "allowedTools": [],
  "hasTrustDialogAccepted": false
}
```

**After:**

```json
"C:/Users/<username>": {
  "allowedTools": [],
  "hasTrustDialogAccepted": true
}
```

## Verify

Run in a new terminal:

```bash
claude remote-control
```

You should see:

```
·✔︎· Connected · <username> · HEAD

Continue coding in the Claude app or https://claude.ai/code/session_...
space to show QR code
```

> **Note on QR code**: On Windows CMD, the spacebar may not display the QR code. Use the URL directly in your mobile browser instead.

## Summary

| Item | Detail |
|------|--------|
| Root cause | `hasTrustDialogAccepted: false` in `.claude.json` |
| Affected path | Forward slash format `C:/Users/<username>` |
| Fix | Set to `true` directly in the file |

Hope this helps other Windows users hitting the same wall.
