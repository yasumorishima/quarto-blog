---
title: I Had Claude Fable 5 Review My Indie Diary App Before It Got Pulled — The Bugs It Caught
published: true
description: I used Claude Fable 5 to do a pre-release quality pass on my Flutter diary app days before the US government suspended the model. Here are the real diffs it produced, and an honest solo-dev take.
tags: flutter, claude, ai, indiedev
---

## Intro

I had Claude Fable 5 review and fix my Flutter diary app, **Daily Diary** (live on Google Play), before a release. This is a record of that.

Fable 5 was pulled worldwide just three days after launch (June 9 -> June 12, 2026) by a US Commerce Department export-control directive — but I got this pass in right before it went dark. Instead of generic "it caught what other models missed" claims, I'm pasting the **actual diffs** from my repo's commit history.

## The app: Daily Diary

A simple offline diary app.

- 📱 **Offline-first**: data stays on the device, no cloud
- 🌐 **5 languages**: Japanese / English / Chinese / Korean / Spanish
- 🌙 Dark mode, 📅 calendar with mood indicators, 📊 stats (streaks, mood trends), 🔍 full-text search, 🎲 random past entry, 💾 JSON export/import
- Google Play: https://play.google.com/store/apps/details?id=com.diary.daily

Stack: Flutter 3.x / Dart, Provider, Hive (local NoSQL), Flutter intl.

## What I asked for

Not "rewrite everything" — more like *"find and fix what's questionable quality-wise"*: resolve `flutter analyze` warnings (there were 47), set up tests, add CI, update dependencies.

## 1. BuildContext used across an async gap

Several spots touched `BuildContext` (`Navigator`, localization) after an `await`. If the widget is disposed during the await, that throws. Fable inserted `if (!mounted) return;` right after the await:

```diff
   final db = DatabaseService();
   final existingEntry = await db.getEntryByDate(_selectedDate);
+  if (!mounted) return;

   final result = await Navigator.push(
     context,
```

You rarely hit this in normal use, so it's easy to miss even when testing yourself.

## 2. Hoisting the l10n lookup before the await

In the import handler `_importData`, `AppLocalizations.of(context)` (localized strings) was looked up repeatedly *after* awaits. It got hoisted to a single lookup before the first await, with a `mounted` guard before showing the confirmation dialog:

```diff
       _isImporting = true;
     });
+
+    final l10n = AppLocalizations.of(context)!;

     try {
       final result = await FilePicker...
       ...
       if (file.bytes == null) {
-        final l10n = AppLocalizations.of(context)!;   // looked up after await
         throw Exception(l10n.fileReadError);
       }
       ...
-      final l10n = AppLocalizations.of(context)!;
+      if (!mounted) return;                            // guard before dialog
```

## 3. The test that tested nothing

The leftover template `widget_test.dart` referenced a non-existent `MyApp` and didn't even compile (= effectively zero tests). It was removed and replaced with **12 real tests** for the model and Hive persistence:

```
removed test/widget_test.dart             (broken template)
added  test/diary_entry_test.dart   +49   (model serialization, etc.)
added  test/database_service_test.dart +92 (Hive-backed save/load)
```

"You think you have tests, you don't" is the scariest state to be in, so fixing this mattered most.

## 4. 47 analyzer warnings to zero

The headline one was the `Color.withOpacity()` deprecation (`withValues` is now preferred for color precision). 27 spots replaced:

```diff
-  color: Colors.white.withOpacity(0.1),
+  color: Colors.white.withValues(alpha: 0.1),
```

Plus removing the deprecated `ColorScheme.background / onBackground`, and migrating `RadioListTile` (`groupValue / onChanged` removed) to the `RadioGroup` ancestor API. `dart fix --apply` handled the mechanical ones; API migrations were done by hand.

## 5. Major dependency bumps

Bumped the main dependencies, with two breaking API changes:

```diff
-  google_mobile_ads: ^4.0.0
+  google_mobile_ads: ^9.0.0
-  share_plus: ^7.2.1
-  file_picker: ^8.1.4
+  share_plus: ^12.0.2
+  file_picker: ^11.0.2
```

**share_plus**: `Share.shareXFiles(...)` -> `SharePlus.instance.share(ShareParams(...))`.

```diff
-  await Share.shareXFiles(
-    [XFile(file.path)],
-    subject: fileName,
+  await SharePlus.instance.share(
+    ShareParams(
+      files: [XFile(file.path)],
+      subject: fileName,
+    ),
   );
```

**file_picker**: the instance API `FilePicker.platform.pickFiles(...)` became a static `FilePicker.pickFiles(...)`.

```diff
-  final result = await FilePicker.platform.pickFiles(
+  final result = await FilePicker.pickFiles(
```

On the pins: share_plus 13 conflicts with file_picker 11, and file_picker 12 is beta-only — so I settled on **share_plus 12 / file_picker 11**.

## 6. Added CI

A new `flutter-ci.yml` runs `flutter analyze` + tests on push/PR, so the project can't slip back into the "broken test" state.

## How it felt as a solo dev

Honestly, what Fable caught wasn't flashy features — it was the class of things I systematically don't check on my own:

- async-gap mounted -> only crashes on certain timing
- a broken test -> you think you have tests, you don't
- a pile of deprecations -> works now, breaks later
- stale dependencies -> major bumps get postponed out of fear of breaking changes

I can write the features myself, but "only fails under specific conditions," "are the tests actually testing anything," and "deprecated-API + dependency housekeeping" tend to slip without a dedicated reviewer. One thorough pass on that was genuinely useful for a side project.

There are limits too: device-UI-dependent behavior (ads, export/import sharing) can't be verified in CI — I still test that on a real device. Concept, design, device testing, store submission, and final review stay my job.

It's a shame it went dark after three days, but I'm glad I got this pass in before it did.

---

Daily Diary is live on Google Play — give it a try:

📱 https://play.google.com/store/apps/details?id=com.diary.daily
