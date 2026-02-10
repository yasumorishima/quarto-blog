---
title: What a Non-Engineer Built with Claude Code in One Month
published: true
description: A honest account of building a Flutter app, contributing to OSS, and publishing Kaggle datasets — all without a software engineering background.
tags: claudecode, ai, flutter, productivity
canonical_url: https://yasumorishima.github.io/quarto-blog/
---

## Introduction

I'm not a software engineer. I don't write code for work, and I didn't study computer science. I'm the kind of person who tinkers with code as a hobby.

That said, after starting to use Claude Code in late 2025 / early 2026, more things happened than I expected. This isn't a success story — it's just a record of what someone like me was actually able to do.

---

## What is Claude Code?

It's an AI agent from Anthropic that runs in your terminal. It doesn't just read and write code — it handles file operations, git commands, and runs shell commands autonomously. You tell it what you want in plain language, it reads the relevant files, makes the changes, and runs the tests.

---

## What I Built

### 1. Released a Flutter App

This was the biggest one.

I published an Android app called **Daily Diary** on Google Play.

https://play.google.com/store/apps/details?id=com.diary.daily

A "tsubuyaki diary" (日付連用日記) is a format where multiple years of entries for the same date are shown on one page — so you can immediately see what you wrote on this day last year, or two years ago. It's a traditional format in Japanese paper diaries that I wanted to bring to mobile in a simple way.

Flutter was mostly new to me. I started by describing what I wanted to build, then worked through each feature with Claude Code's help: tag input, data export, AdMob integration, localization (Japanese, English, Chinese, Korean, Spanish), and adaptive icon setup. The icon alone caused issues across versions v1.0.7 through v1.0.13, but it eventually got resolved.

Shipping a Flutter app to Google Play from scratch as a non-engineer wasn't something I had considered doing before. Without Claude Code, I would probably have gotten stuck and stopped somewhere in the middle.

---

### 2. Submitted Pull Requests to OSS Projects

Contributing to open-source projects always felt like something that required being "a real programmer."

But reading through codebases with Claude Code, things started standing out: "this error message isn't helpful," "this method is going to be deprecated." I ran cycles of identifying an issue, confirming the fix with Claude Code, and submitting a PR. Over time, the results looked like this:

- **team-mirai-volunteer/action-board**: 11 PRs merged (bug fixes, refactoring, test additions)
- **pybaseball** (Python library for MLB data): 7 PRs submitted
- **dfinity/icp-js-core**: error message improvement PR
- **line/line-bot-mcp-server**: added get_follower_ids tool PR

Finding where to fix something, verifying the fix is appropriate, writing the PR description — I did all of this alongside Claude Code. I made the decisions; Claude Code helped with the implementation.

---

### 3. Published 4 Kaggle Datasets

I created and published four Kaggle datasets on baseball (MLB), all achieving a quality score of 10.0/10.

- Dataset 1: Japanese MLB Players Statcast (2015-2025)
- Dataset 2: MLB Bat Tracking (2024-2025)
- Dataset 3: MLB Pitcher Arsenal Evolution (2020-2025)
- Dataset 4: MLB Statcast + Bat Tracking (2024-2025) (~1.44M rows)

Data collection scripts, bulk column description input scripts, analysis notebooks, and blog posts — all of it was done alongside Claude Code.

---

### 4. Published 15 Technical Blog Posts

In the past month or two, I've published 15 technical articles on Zenn and Qiita.

Analysis walkthroughs, library usage guides, OSS contribution reports, Flutter development pitfalls, GitHub Actions configs. Most of the content came out of the work I was doing with Claude Code.

Writing the articles themselves also involved Claude Code — structuring the post, reviewing drafts, formatting code blocks.

---

## What I Noticed

**"Moving forward without fully understanding" became possible**

Before, venturing into an unfamiliar technical area meant starting with research — and often just ending there. After starting to use Claude Code, I found a cycle where I could build something working while learning along the way.

**Don't over-delegate**

Trusting everything Claude Code produces is risky. When errors come up, if you don't have a handle on what's happening yourself, you'll repeat the same mistakes. Keeping the habit of reading code matters.

**Figuring out what you actually want is your job**

This was harder than expected. Claude Code does what it's told, but deciding what to do is on you. When the goal is vague, the AI can do work and still miss the mark.

---

## Looking Ahead to 2026

An iOS version of Daily Diary, the next datasets, the next OSS project — there's plenty left.

The feeling of "I can't do this because I'm not an engineer" has faded. That might be the most meaningful thing that changed.

---

App on Google Play (Android):
https://play.google.com/store/apps/details?id=com.diary.daily
