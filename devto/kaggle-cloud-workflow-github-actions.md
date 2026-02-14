---
title: "Git-Driven Kaggle: Manage Notebooks in GitHub, Auto-Deploy via Actions"
published: true
description: Stop editing notebooks in Kaggle's browser editor. Use Git for version control, VSCode for editing, and GitHub Actions to auto-deploy to Kaggle.
tags: kaggle, githubactions, python, machinelearning
---

## The Problem

Are you editing Kaggle Notebooks directly in the browser editor?

- No version control — can't diff, branch, or roll back changes
- Stuck with Kaggle's editor instead of VSCode or your preferred tools
- Manual upload every time you change something

The goal: **manage notebook code in GitHub with full Git workflow, and auto-deploy to Kaggle via `git push`**.

## The Workflow

```
Edit notebook → git push → GitHub Actions → kaggle kernels push → Submit via browser
```

| Step | Automated? | How |
|---|---|---|
| Edit notebook | - | Any device |
| Upload to Kaggle | **Yes** | GitHub Actions + `kaggle kernels push` |
| Submit | **Manual** | Browser: "Submit to Competition" |
| Check score | **Yes** | `kaggle competitions submissions` API |

## Why Can't We Fully Automate?

I spent a lot of time trying to make submission fully automatic. Here's what I found:

The Kaggle API's `CreateCodeSubmission` endpoint returns **403 Forbidden**:

```
Permission 'kernelSessions.get' was denied
```

I tested every combination:

| Auth Method | CLI Version | API | Result |
|---|---|---|---|
| Legacy API Key | 1.8.4 | `competition_submit_code` | 403 |
| New API Token (KGAT_...) | 1.8.4 | `competition_submit_code` | 403 |
| New API Token (KGAT_...) | 2.0.0 | `competition_submit_code` | 403 |
| New API Token (KGAT_...) | 2.0.0 | `competitions submit` (file) | 400 |

### Why?

- **Permission scope limitation**: `kernelSessions.get` monitors notebook execution sessions. Public API tokens don't include this scope.
- **Code competitions are special**: Unlike uploading a CSV, notebook submission involves re-execution and progress monitoring on the platform, requiring higher-level control permissions.
- **File submission doesn't work either**: Code competitions reject direct CSV uploads (400 Bad Request).

**Conclusion**: Until the API is updated, the hybrid approach (automate deployment, manually submit) is the most practical.

## Setup

### Directory Structure

```
kaggle-competitions/
├── .github/workflows/
│   └── kaggle-push.yml
├── deep-past/
│   ├── kernel-metadata.json
│   └── deep-past-baseline.ipynb
```

### kernel-metadata.json

```json
{
  "id": "your-username/your-kernel-slug",
  "title": "Your Kernel Title",
  "code_file": "your-notebook.ipynb",
  "language": "python",
  "kernel_type": "notebook",
  "is_private": "false",
  "enable_gpu": "false",
  "enable_internet": "false",
  "competition_sources": ["competition-slug"]
}
```

**Critical**: `enable_internet` must be `"false"`. Internet ON prevents the notebook from being eligible for submission in code competitions.

### GitHub Actions Workflow

```yaml
name: Kaggle Kernels Push

on:
  workflow_dispatch:
    inputs:
      notebook_dir:
        description: 'Notebook directory'
        required: true
        type: string

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install kaggle CLI
        run: pip install kaggle

      - name: Push notebook to Kaggle
        env:
          KAGGLE_API_TOKEN: ${{ secrets.KAGGLE_API_TOKEN }}
        run: kaggle kernels push -p "${{ inputs.notebook_dir }}"
```

Set `KAGGLE_API_TOKEN` in your repo's GitHub Secrets (Kaggle Settings → API Tokens → Generate).

## Gotchas

### 1. Data Path

`competition_sources` mounts at:

```
/kaggle/input/competitions/<slug>/
```

NOT `/kaggle/input/<slug>/`. The `competitions/` subdirectory is easy to miss.

### 2. Windows Encoding

`kaggle kernels output` crashes on Windows with non-ASCII characters (cp932 error). Use the API directly with `urllib.request` and UTF-8 decoding instead.

### 3. Kernel Slug Must Match Title

If your `kernel-metadata.json` title doesn't resolve to the specified `id` slug, you'll get a 400 error on push. Keep them consistent.

## Results

I used this workflow for the [Deep Past Challenge](https://www.kaggle.com/competitions/deep-past-initiative-machine-translation) (Akkadian → English translation):

- Pushed a TF-IDF nearest neighbor baseline via GitHub Actions
- Submitted via browser
- **Public Score: 5.6**

The iteration cycle is fast: edit locally → push → submit → check score.

## Summary

Full automation of Kaggle code competition submissions isn't possible via the public API (as of Feb 2026). But managing notebooks in GitHub gives you proper version control, your favorite editor, and one-command deployment to Kaggle.

The one manual click to submit is a small price for a proper Git workflow.
