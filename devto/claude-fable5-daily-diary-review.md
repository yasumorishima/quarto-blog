---
title: I Had Claude Fable 5 Review My Indie Diary App Before It Got Pulled — The Bugs It Caught
published: true
description: I used Claude Fable 5 to do a quality pass on my Flutter diary app days before the US government suspended the model. Here are the real bugs it caught, and an honest solo-dev take.
tags: flutter, claude, ai, indiedev
---

## Intro

I maintain a small diary app, **Daily Diary** (Flutter, live on Google Play), as a side project. Before a release I wanted a proper quality pass, so I had Claude Fable 5 review and fix the code. This is a record of that.

Fable 5 launched on June 9, 2026. Three days later, on the evening of June 12, the US Commerce Department issued an export-control directive and access was suspended worldwide. The directive bans access to Fable 5 and Mythos 5 by any foreign national — inside or outside the US, including Anthropic's own foreign-national employees; since Anthropic can't separate US users from foreign nationals in real time, it shut the models down for everyone. The cited reason is national security (no specifics in the letter); reporting suggests the trigger was a technique to bypass Fable 5's safeguards. As of writing (June 15) it's still down with no return date — Anthropic calls it a misunderstanding and is routing users to Opus 4.8. A short window, but I got this one pass in before it went dark, so I'm writing down what it actually did.

I'm only listing **real fixes** that are in my repo's commit history — not generic "it found bugs other models missed" claims.

## The app: Daily Diary

A simple offline diary app.

- **Offline-first**: data stays on the device, no cloud
- **5 languages**: Japanese / English / Chinese / Korean / Spanish
- Dark mode, calendar with mood indicators, stats (streaks, mood trends), full-text search, random past entry, JSON export/import

Google Play: https://play.google.com/store/apps/details?id=com.diary.daily

Stack: Flutter 3.x / Dart, Provider, Hive (local NoSQL), Flutter intl.

## What I asked for

Not "rewrite everything" — more like *"find and fix what's questionable quality-wise"*: resolve `flutter analyze` warnings, set up tests, add CI.

## The bugs it found

### 1. BuildContext used across async gaps without a mounted check

Several places touched `setState` / `BuildContext` (localization, `Navigator`) after an `await`. If the widget gets disposed during the async call, that crashes — something that can surface in export/import flows.

```dart
// Before (illustrative): touches the widget even if it was disposed during await
await databaseService.importData(file);
setState(() { /* ... */ });                 // throws if disposed
final l10n = AppLocalizations.of(context)!; // context across await

// After: capture before await / guard with mounted
final l10n = AppLocalizations.of(context)!;
await databaseService.importData(file);
if (!mounted) return;
setState(() { /* ... */ });
```

You rarely hit this in normal use, so it is easy to miss even when testing yourself.

### 2. The test that tested nothing

The leftover template `widget_test.dart` referenced a non-existent `MyApp` and did not even compile (= effectively zero tests). It was replaced with 12 real tests for the model and Hive persistence, plus CI that runs analyze + tests on push/PR.

### 3. 47 analyzer warnings to zero

`withOpacity` deprecation -> `withValues` (27 spots), deprecated ColorScheme API, `RadioListTile` -> `RadioGroup` migration. Major dependencies were bumped too.

## How it felt as a solo dev

Honestly, what Fable caught was not flashy features — it was the class of bugs I systematically do not check on my own:

- async-gap mounted -> only crashes on certain timing
- a broken test -> you think you have tests, you do not
- a pile of deprecations -> works now, breaks later

I can write the features myself, but "only fails under specific conditions", "are the tests actually testing anything", and "deprecated-API cleanup" tend to slip without a dedicated reviewer. Getting one thorough pass on that was genuinely useful for a side project.

There are limits too: device-UI-dependent behavior (ads, export/import sharing) cannot be verified in CI — I still test that on a real device myself. Concept, design, device testing, store submission, and final code review stay my job.

It is a shame it went dark after three days, but I am glad I got this pass in before it did.

---

Daily Diary is live on Google Play — give it a try:

📱 https://play.google.com/store/apps/details?id=com.diary.daily
