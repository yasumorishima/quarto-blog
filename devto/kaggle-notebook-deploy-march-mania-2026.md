---
title: "Deploy Kaggle Notebooks with git push — I Built a CLI Tool for It"
published: true
description: kaggle-notebook-deploy is a PyPI CLI tool that automates Kaggle Notebook deployment via GitHub Actions, so you never have to use the browser editor again.
tags: kaggle, python, github, machinelearning
---

## The Problem

Are you still editing Kaggle Notebooks directly in the browser?

The browser editor means:
- No Git version control
- Painful diff review
- Can't use your preferred editor (VSCode, etc.)

I built a CLI tool to fix this.

## kaggle-notebook-deploy

```bash
pip install kaggle-notebook-deploy
```

**PyPI**: https://pypi.org/project/kaggle-notebook-deploy/
**GitHub**: https://github.com/yasumorishima/kaggle-notebook-deploy

The workflow:

```
Edit notebook → git push → GitHub Actions → Upload to Kaggle → Submit in browser
```

## Setup (5 minutes)

### 1. Install

```bash
pip install kaggle-notebook-deploy
```

### 2. Initialize repository

```bash
mkdir my-kaggle && cd my-kaggle && git init
kaggle-notebook-deploy init-repo
```

This generates:

```
my-kaggle/
├── .github/workflows/
│   └── kaggle-push.yml       # auto-deploys on workflow_dispatch
├── scripts/
│   └── setup-credentials.sh
└── .gitignore
```

### 3. Set GitHub Secrets

```bash
gh secret set KAGGLE_USERNAME
gh secret set KAGGLE_KEY
```

### 4. Create a competition directory

```bash
# GPU-enabled, public notebook
kaggle-notebook-deploy init march-machine-learning-mania-2026 --gpu --public
```

This generates `kernel-metadata.json` (pre-filled with your username) and a baseline `.ipynb`.

### 5. Deploy

```bash
# Direct push from local
kaggle-notebook-deploy push march-machine-learning-mania-2026

# Or via GitHub Actions
git add . && git commit -m "update" && git push
gh workflow run kaggle-push.yml -f notebook_dir=march-machine-learning-mania-2026
```

## Real-world example: March Machine Learning Mania 2026

I used this tool to enter [March Machine Learning Mania 2026](https://www.kaggle.com/competitions/march-machine-learning-mania-2026) — an NCAA basketball tournament prediction competition.

The notebook covers both Men's and Women's tournaments using LightGBM + Logistic Regression:

→ https://www.kaggle.com/code/yasunorim/march-machine-learning-mania-2026-baseline

Every iteration was: edit locally → `kaggle-notebook-deploy push` → done.

## Pitfalls I Hit

### 1. The data path trap

When you use `competition_sources` in `kernel-metadata.json`, the data mounts at:

```
/kaggle/input/competitions/<slug>/
```

**NOT** `/kaggle/input/<slug>/`. Note the `competitions/` subdirectory.

Hardcoding the wrong path causes `FileNotFoundError`. Always auto-detect:

```python
from pathlib import Path

INPUT_ROOT = Path('/kaggle/input')
DATA_DIR = None
for p in INPUT_ROOT.rglob('your-expected-file.csv'):
    DATA_DIR = p.parent
    break

if DATA_DIR is None:
    for item in sorted(INPUT_ROOT.iterdir()):
        print(f'  {item.name}/')
        for sub in sorted(item.iterdir())[:5]:
            print(f'    {sub.name}')
    raise FileNotFoundError('Data directory not found.')
```

### 2. The NaN fillna trap

Some feature columns may be entirely NaN (e.g., Massey Ordinals aren't available for Women's data). `fillna(median)` does nothing when the median itself is NaN.

```python
# Wrong: if all values are NaN, median is NaN and fillna does nothing
X = df[feat_cols].fillna(df[feat_cols].median()).values

# Correct: fallback to 0 for all-NaN columns
X = df[feat_cols].fillna(df[feat_cols].median()).fillna(0).values
```

### 3. Windows encoding issue

On Windows (cp932), `kaggle-notebook-deploy push` can fail with a codec error. Add `PYTHONUTF8=1`:

```bash
PYTHONUTF8=1 kaggle-notebook-deploy push march-machine-learning-mania-2026
```

## Why can't it be fully automated?

The ideal is `git push` → submit, but Kaggle limitations prevent it:

1. **API restriction** — `CreateCodeSubmission` returns 403 with public tokens
2. **Secrets reset** — `kaggle kernels push` unlinks Notebook Secrets each time
3. **Rule acceptance** — competition participation requires one-time browser consent

So the final "Submit to Competition" click is still manual. But automating everything else (version control, diff review, deployment) is already a huge improvement.

## Command Reference

| Command | Description |
|---|---|
| `init-repo` | Generate GitHub Actions workflow |
| `init <slug>` | Create competition directory |
| `validate <dir>` | Validate kernel-metadata.json |
| `push <dir>` | Deploy to Kaggle |

Key `init` options:

| Option | Description |
|---|---|
| `--gpu` | Enable GPU |
| `--public` | Public notebook |
| `--title` | Custom title |
| `--internet` | Enable internet (not recommended for code competitions) |

## Summary

```bash
pip install kaggle-notebook-deploy
kaggle-notebook-deploy init-repo
kaggle-notebook-deploy init titanic
# edit notebook...
kaggle-notebook-deploy push titanic
```

Say goodbye to the browser editor and bring the full GitHub ecosystem to your Kaggle competitions.
