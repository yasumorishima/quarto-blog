---
title: "I Built a Free Baseball Info Twitter Bot on Raspberry Pi"
published: true
description: "How I automated baseball tweets using Raspberry Pi 5 + OpenClaw + Gemini API free tier. Running cost: ~$2/month (electricity only)."
tags: raspberrypi, python, bot, gemini
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/raspi-baseball-bot-openclaw-gemini/
---

> Setup guide — Raspberry Pi as a sandboxed AI agent environment

## Motivation

"I want AI to pull the latest baseball news and tweet it automatically."

That's how this project started. I built an automated baseball tweet bot using **Raspberry Pi 5 + OpenClaw + Gemini API (free tier)**. Running cost: ~$2/month (electricity only).

Most AI bot tutorials you'll find use:

- **ChatGPT API** → pay-per-use (at least $5/month)
- **Claude API** → pay-per-use
- **AWS Lambda + DynamoDB** → charges when you exceed the free tier
- **Heroku / Railway** → free plans discontinued or heavily restricted

This post is for people who want to experiment cheaply. If you have a Raspberry Pi sitting around, you can start today.

## What It Produces

The bot posts tweets like this 13 times a day, fully automatically:

> WBC 2026 starts March 5th! Can't wait! The excitement is like the silence before the Earth's core starts boiling. ⚾

The character is "a slightly quirky baseball-obsessed old guy." The tweet quality is, well, what it is — but it runs.

## Architecture & Cost

```
[cron schedule] → [OpenClaw Gateway] → [Gemini 2.5 Flash API]
                                              ↓
                                        web_search for latest news
                                              ↓
                                        write tweet (140 chars)
                                              ↓
                                    [tweet.js] → Twitter API
```

| Item | Cost | Notes |
|------|------|-------|
| Raspberry Pi 5 | One-time only | 4GB is enough |
| Gemini 2.5 Flash | **Free** | 15 RPM / 1500 RPD free tier |
| X (Twitter) API | **Free** | Free Tier: 500 posts/month |
| OpenClaw | **Free** | OSS AI agent framework |
| Electricity | ~$2/month | Pi 5 max 27W |

**Monthly running cost: ~$2 (electricity only)**

## Why Raspberry Pi?

"Why not just use a VPS?" Fair question. Here's why I went with Pi:

1. **Perfect sandbox** — When you let AI run shell commands, you want it completely isolated from your main PC. Worst case, you re-flash the SD card
2. **Always-on by design** — VPS free tiers have time limits or get suspended. Pi just stays on
3. **Low learning curve** — SSH in, run commands. No Kubernetes, Docker, or AWS needed
4. **One-time cost** — No monthly billing, so you can leave it running without worry

## Tech Stack

### What is OpenClaw?

[OpenClaw](https://openclaw.ai/) is an open-source AI agent framework. In short:

- Gateway for LLMs (Gemini, Claude, Ollama, etc.)
- Runs scheduled tasks via cron
- Has an `exec` tool — AI can run shell commands directly
- Has `web_search` for real-time information
- Integrates with Discord, Slack, Telegram, etc.

The flow here is: **cron → Gemini → web_search → exec (tweet.js)**

### Gemini 2.5 Flash Free Tier

Get an API key from Google AI Studio and use Gemini 2.5 Flash for free:

- **15 RPM** (requests per minute)
- **1500 RPD** (requests per day)

13 cron jobs/day is well within the limit. I space jobs at least 1 hour apart.

### Twitter API Free Tier

500 posts/month limit. At 13 tweets/day × 30 days = 390 posts — fits comfortably. Write-only (no timeline read), but that's fine for a bot.

## Setup (Overview)

Full instructions are in the [repository README](https://github.com/yasumorishima/raspi-baseball-bot). Here's the high-level flow.

### 1. Install OpenClaw on Pi

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard  # enter your Gemini API key
```

### 2. Add the tweet script

`tweet.js` is a simple ~30-line Node.js script:

```javascript
// simplified
const { TwitterApi } = require("twitter-api-v2");
const client = new TwitterApi({ /* OAuth 1.0a keys */ });
const text = process.argv.slice(2).join(" ");
await client.v2.tweet(text);
```

### 3. Define the bot's personality (SOUL.md)

OpenClaw reads `SOUL.md` from the workspace to set the agent's character:

```markdown
# Baseball Guy

## Tweet style
- Casual, like muttering at a bar
- Under 140 characters
- RULE: include one grandiose, off-the-wall metaphor every time
```

### 4. Register cron jobs

```bash
openclaw cron add \
  --cron "0 9 * * *" \
  --tz "Asia/Tokyo" \
  --name "WBC 09:00" \
  --system-event "Look up the latest WBC news and tweet in under 140 characters."
```

Every day at 9am: Gemini wakes up, searches the web, writes a tweet, posts it. Fully automatic.

### 5. Persist with systemd

```bash
systemctl --user enable openclaw-gateway
systemctl --user start openclaw-gateway
```

Auto-starts when Pi boots. No need to SSH in.

## The Ollama Rabbit Hole (Bonus)

I originally tried running everything **offline** with Ollama (local LLM). No API limits, full privacy — sounds ideal, right?

**It didn't work on Raspberry Pi 5 + llama3.2:3b.**

### The traps I fell into

1. **OpenClaw hardcodes contextWindow at 128K** → Instant OOM on Pi. Patched dist files to 8K
2. **CONTEXT_WINDOW_HARD_MIN is 16K** → Conflicts with 8K context. Another dist patch
3. **Tools schema alone is 17K characters** → Disabled most tools via `tools.deny`
4. **OLLAMA_LOAD_TIMEOUT=0 means "default 5 min", not "unlimited"** → Subtle trap
5. **stream:true causes GIN server to timeout after 5 min of silence** → Patched to stream:false
6. **prompt eval: 4.1 tokens/sec** → 3800-token prompt takes 15 min. HTTP 500 at 5 min
7. **Swap was only 200MB** → Expanded to 2GB

After solving all of that, **llama3.2:3b's tool calling accuracy was terrible**:

- Passes `"{}"` (string) to `env` argument instead of an object → validation error
- Outputs tool calls as plain text instead of function calls
- When asked about the Hanshin Tigers, replied in English: "Let's go Orix!" (wrong team entirely)

**After 2 days of fighting, I switched to Gemini. It posted a tweet in 18 seconds.** Some problems are worth paying (or not paying) to solve.

See [OLLAMA_TROUBLESHOOTING.md](https://github.com/yasumorishima/raspi-baseball-bot/blob/master/OLLAMA_TROUBLESHOOTING.md) for the full breakdown.

## Security

Letting AI run shell commands requires care. Using Pi as a **sandboxed environment** keeps the risk contained:

- **Dedicated machine** — no personal data from main PC
- **UFW firewall** — block all incoming except SSH
- **Gateway bound to localhost** — not reachable externally
- **tools.deny** — AI can only use `exec` and `web_search`
- **.env permissions 600** — API keys locked down

If the AI goes rogue, the damage stays on the Pi. Worst case: re-flash the SD card.

## Summary

| Attempt | Result |
|---------|--------|
| Ollama (fully offline) | 2 days of struggle, gave up |
| Gemini API (free tier) | Working in 18 seconds |
| Monthly running cost | ~$2 (electricity only) |
| Setup time (Gemini) | ~1 hour |

Before spending money on cloud infrastructure, try Raspberry Pi first. It's disposable, always-on, and free to run after the initial hardware cost.

Source code: [github.com/yasumorishima/raspi-baseball-bot](https://github.com/yasumorishima/raspi-baseball-bot)
