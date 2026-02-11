---
title: How I Moved Flutter Android Builds to GitHub Actions (Low-Spec PC)
published: true
description: Building Flutter APKs on a Celeron N4500 / 4GB RAM laptop was painful. Here's how I moved to GitHub Actions cloud builds.
tags: flutter, android, githubactions, cicd
---

## Background

I'm building an Android app with Flutter as a side project.

My development machine is a Celeron N4500 / 4GB RAM laptop. Running `flutter build apk` locally meant the fan would spin up, the PC would freeze for other tasks, and builds took 10+ minutes. Disk space was also getting tight.

I moved the build process to GitHub Actions. Now I just push code and download the APK when the cloud build finishes.

---

## The Workflow

```
Local: edit code → git push
GitHub Actions: flutter build apk --release → save APK as Artifact
Local: gh run download → upload APK to Google Play Console
```

No local Android SDK required.

---

## Setup

### 1. Encode your keystore to base64

Your signing keystore needs to be stored as a GitHub Secret. First, encode it:

```python
import base64
with open('android/app/upload-keystore.jks', 'rb') as f:
    print(base64.b64encode(f.read()).decode('utf-8'))
```

Copy the output string.

### 2. Add GitHub Secrets

Go to your repo's `Settings → Secrets and variables → Actions` and add these four secrets:

| Secret | Value |
|---|---|
| `KEYSTORE_BASE64` | The base64 string from above |
| `STORE_PASSWORD` | Your keystore password |
| `KEY_PASSWORD` | Your key password |
| `KEY_ALIAS` | Your key alias (e.g. `upload`) |

### 3. Create the workflow file

Create `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    branches:
      - master
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Java 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: 'stable'
          cache: true

      - name: Install dependencies
        run: flutter pub get

      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/app/upload-keystore.jks

      - name: Create key.properties
        run: |
          cat > android/key.properties << EOF
          storePassword=${{ secrets.STORE_PASSWORD }}
          keyPassword=${{ secrets.KEY_PASSWORD }}
          keyAlias=${{ secrets.KEY_ALIAS }}
          storeFile=upload-keystore.jks
          EOF

      - name: Build release APK
        run: flutter build apk --release

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: release-apk
          path: build/app/outputs/flutter-apk/app-release.apk
          retention-days: 7
```

### 4. Download the APK

After the build completes, download using GitHub CLI:

```bash
# Check the latest run ID
gh run list --repo your-username/your-repo --limit 3

# Download APK
gh run download <RUN_ID> --repo your-username/your-repo --dir ./apk-output
```

Or download directly from the GitHub Actions page → click the run → scroll to Artifacts.

---

## Tips

**Match your branch name**

Make sure the branch name in `on: push: branches:` matches your actual default branch. Some repos use `main`, others use `master`.

**Keep keystore out of git**

```
# .gitignore
*.jks
*.keystore
key.properties
```

Never commit your keystore. Using GitHub Secrets keeps the signing process secure even in cloud builds.

**First build is slower**

The first run downloads Flutter and all dependencies (~15 min). Subsequent builds use `subosito/flutter-action`'s cache and are significantly faster.

---

## Comparison

| | Local build | GitHub Actions |
|---|---|---|
| Build time | 10+ min (low-spec PC) | ~15 min first run, faster after |
| CPU/fan | Maxed out | Zero |
| Disk usage | build/ folder bloats | Zero |
| Android SDK needed | Yes | No |

If you're on a low-spec machine or just want a cleaner local environment, this setup works well.
