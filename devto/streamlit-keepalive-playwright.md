---
title: "HTTP 200 but Your Streamlit App Is Still Sleeping — Why GET Requests Don't Work and How Playwright Fixes It"
published: true
description: Streamlit Community Cloud apps sleep after inactivity. HTTP GET returns 200 with a static HTML shell, but the Python app never starts. Use Playwright to actually wake them up.
tags: streamlit, playwright, python, devops
canonical_url: https://zenn.dev/shogaku/articles/streamlit-keepalive-playwright
---

## TL;DR

- Streamlit Community Cloud apps go to sleep (Zzz) after inactivity
- Sending HTTP GET requests returns **200 OK** — but the app stays asleep
- The response is a static HTML shell (4,271 bytes). The Python process never starts
- **Playwright (headless Chromium)** executes JavaScript and establishes the WebSocket connection that actually wakes the app
- Deployed on Raspberry Pi Docker + GitHub Actions as backup

---

## The Problem: 30 Apps, All Sleeping

I deployed 30 Streamlit apps for a WBC 2026 scouting dashboard project (20 national teams × batter/pitcher). After a few days without visitors, they all go to sleep.

My first approach: run a keepalive script on a Raspberry Pi that sends HTTP GET requests every few hours. Simple, right?

---

## Attempt 1: urllib + CookieJar

Streamlit Cloud has an auth redirect (303), so plain `urllib` fails. Adding a `CookieJar` to follow redirects gives us HTTP 200:

```python
import http.cookiejar
import urllib.request

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ..."})

with opener.open(req, timeout=90) as resp:
    body = resp.read()
    print(f"OK {resp.status} ({len(body)} bytes)")
    # → OK 200 (4271 bytes)
```

All 35 URLs returned `OK 200 (4271 bytes)`. Problem solved?

**Nope. The apps were still sleeping.**

---

## Investigation: Same 4,271 Bytes Every Time

Every single URL returned the exact same response:

```html
<!doctype html>
<html lang="en">
  <head>...</head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

This is a **static HTML shell** — the SPA loader page. The actual app content is loaded via JavaScript and WebSocket.

I also tried the `/_stcore/health` endpoint, but it returned a 303 redirect that ultimately served the same HTML shell.

---

## Root Cause: SPAs Don't Wake Up from HTTP GET

Here's how Streamlit Cloud works:

```
HTTP GET  →  static HTML shell (4,271 bytes)  →  done. Python never runs.

Browser   →  HTML  →  JS executes  →  WebSocket (/_stcore/stream)  →  Python starts
```

The HTTP GET request never triggers the JavaScript execution that establishes the WebSocket connection. Without the WebSocket, the Python app process never starts. The 200 status code just means "I successfully served you a static file."

> This isn't Streamlit-specific. **Any SPA** (React, Vue, etc.) has this same architecture. An HTTP health check returning 200 doesn't mean your app is running — it might just be serving the shell page.

---

## Solution: Playwright (Headless Browser)

Playwright runs a real Chromium browser in headless mode. It executes JavaScript, establishes WebSocket connections, and can interact with page elements.

If the app is sleeping, Streamlit shows a "Yes, get this app back up!" button. Playwright clicks it automatically:

```python
from playwright.async_api import async_playwright

async def visit(page, url):
    await page.goto(url, wait_until="domcontentloaded", timeout=120_000)
    await page.wait_for_timeout(5000)

    wake_btn = page.get_by_role("button", name="Yes, get this app back up!")
    if await wake_btn.count() > 0:
        print(f"  WAKE  {url}")
        await wake_btn.click()
        await page.wait_for_timeout(60_000)
    else:
        print(f"  OK    {url}")
```

Output:

```
  OK    https://npb-prediction.streamlit.app/
  WAKE  https://wbc-cuba-batters.streamlit.app/    ← was sleeping, now awake
  WAKE  https://wbc-can-batters.streamlit.app/
  OK    https://wbc-can-pitchers.streamlit.app/
```

---

## Deployment: Raspberry Pi + GitHub Actions

### Raspberry Pi Docker (primary, every 6 hours)

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
    libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libatspi2.0-0 libcups2 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgtk-3-0 libdbus-glib-1-2 \
    fonts-liberation xdg-utils \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir playwright \
    && playwright install chromium

WORKDIR /app
COPY keepalive.py .
CMD ["python", "keepalive.py"]
```

This runs on a Raspberry Pi 5 (ARM64). `playwright install chromium` works on ARM64 out of the box.

### GitHub Actions (backup, every 6 hours)

```yaml
name: Streamlit Keepalive

on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  keepalive:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: |
          pip install playwright
          playwright install chromium --with-deps
      - run: python scripts/keepalive.py
```

---

## What I Tried (and What I Learned)

| Approach | Result | Lesson |
|---|---|---|
| `urllib.request.urlopen` | 303 error | Streamlit Cloud has auth redirects |
| `CookieJar` + `build_opener` | 200 but still sleeping | Static HTML shell, not the app |
| `/_stcore/health` endpoint | 303 → HTML shell | Health check doesn't work when sleeping |
| **Playwright (headless Chromium)** | **App woke up** | Need JS execution + WebSocket |

---

## Beyond Streamlit: Where This Applies

- **Free-tier hosting** (Render, Railway, Koyeb): Similar sleep mechanisms
- **Portfolio/demo apps**: Don't let a recruiter see "Zzzz" — use Playwright + cron to keep apps awake
- **SPA monitoring**: HTTP 200 ≠ app is healthy. For SPAs, you need to verify post-render state

**"HTTP 200 means everything is fine" doesn't hold in the SPA world.**

---

## Repository

- GitHub: [yasumorishima/wbc-scouting](https://github.com/yasumorishima/wbc-scouting)
- Keepalive script: [`scripts/keepalive.py`](https://github.com/yasumorishima/wbc-scouting/blob/master/scripts/keepalive.py)
- GitHub Actions: [`.github/workflows/keepalive.yml`](https://github.com/yasumorishima/wbc-scouting/blob/master/.github/workflows/keepalive.yml)
