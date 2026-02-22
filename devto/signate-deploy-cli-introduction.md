---
title: "Automate SIGNATE Competition Submissions with a CLI Tool: signate-deploy"
published: true
description: "signate-deploy is a PyPI CLI tool that automates SIGNATE competition setup, data download, and submission via GitHub Actions."
tags: python, machinelearning, github, cli
canonical_url: https://zenn.dev/shogaku/articles/signate-deploy-cli-introduction
cover_image:
---

## The Problem

[SIGNATE](https://signate.jp/) is a Japanese data science competition platform, similar to Kaggle.

I previously wrote about [running SIGNATE competitions entirely on GitHub Actions](https://dev.to/yasumorishima/signate-github-actions-cloud-ml-guide-3pe0) — no local GPU needed. But the manual setup for each competition was tedious: creating workflows, configuring CLI auth, managing secrets.

So I built a CLI tool to automate it.

## signate-deploy

```bash
pip install signate-deploy
```

**PyPI**: https://pypi.org/project/signate-deploy/
**GitHub**: https://github.com/yasumorishima/signate-deploy

The tool handles the entire workflow:

```
signate-deploy init-repo   ← Initialize repo + generate GitHub Actions
signate-deploy setup-token ← Configure SIGNATE API token
signate-deploy init        ← Authenticate SIGNATE CLI
signate-deploy submit      ← Submit via GitHub Actions
```

## Setup Flow

### 1. Initialize a competition repository

```bash
python -m signate_deploy init-repo my-competition
cd my-competition
```

This auto-generates:
- `.github/workflows/signate-submit.yml` (submission workflow)
- `.github/workflows/signate-download.yml` (data download workflow)
- `train.py` (template)
- `.gitignore`

### 2. Set up SIGNATE API token

```bash
python -m signate_deploy setup-token
```

Interactive prompt for your SIGNATE email and API token, saved to GitHub Secrets.

### 3. Browse competition info

```bash
# List competitions
python -m signate_deploy competition-list

# List tasks for a competition
python -m signate_deploy task-list --competition-key <competition_key>

# List files for a task
python -m signate_deploy file-list --task-key <task_key>
```

### 4. Download data and submit

```bash
python -m signate_deploy download
python -m signate_deploy submit
```

Both run via `gh workflow run` — everything executes on GitHub Actions.

## Commands

| Command | Description |
|---|---|
| `init-repo` | Initialize repo + generate GitHub Actions |
| `init` | Authenticate SIGNATE CLI |
| `setup-token` | Save API token to GitHub Secrets |
| `submit` | Submit via GitHub Actions |
| `download` | Download data via GitHub Actions |
| `competition-list` | List competitions |
| `task-list` | List tasks |
| `file-list` | List files |

## Real Example: Medical Paper Classification

I used signate-deploy for a SIGNATE competition on classifying medical papers (binary classification: diagnostic accuracy study or not).

```bash
python -m signate_deploy setup-token
python -m signate_deploy download
# ... write training code ...
python -m signate_deploy submit
```

Using TF-IDF + LogisticRegression with threshold tuning (0.05), I scored **0.798** on FBeta (β=7). The entire flow — from token setup to submission — ran on GitHub Actions.

## Gotchas

### Windows PATH issue

On Windows, the `signate-deploy` command may not be on PATH. Use `python -m signate_deploy` instead.

### competition_key vs task_key

The `competition=` value in SIGNATE URLs is the `competition_key`. To download data, you need the `task_key`, which is a separate identifier.

```bash
# Get task_key from competition_key
python -m signate_deploy task-list --competition-key <competition_key>

# Get file_key from task_key
python -m signate_deploy file-list --task-key <task_key>
```

## Summary

```bash
pip install signate-deploy
python -m signate_deploy init-repo my-competition
```

Automates SIGNATE competition setup and submission via CLI.

**PyPI**: https://pypi.org/project/signate-deploy/
**GitHub**: https://github.com/yasumorishima/signate-deploy
