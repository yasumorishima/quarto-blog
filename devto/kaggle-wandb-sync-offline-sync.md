---
title: "Track Kaggle Experiments with W&B — Even Without Internet Access"
published: true
description: "kaggle-wandb-sync is a PyPI CLI tool that syncs W&B offline runs from Kaggle Notebooks automatically via GitHub Actions — even when internet is disabled for competition submissions."
tags: kaggle, python, machinelearning, github
canonical_url: https://zenn.dev/shogaku/articles/kaggle-wandb-sync-offline-sync
cover_image:
---

## The Problem

Kaggle Notebooks disable internet access for competition submissions.

This means you can't push metrics to Weights & Biases in real time — `wandb.log()` calls silently fail, and your experiment tracking is gone.

I built a CLI tool to fix this.

## kaggle-wandb-sync

```bash
pip install kaggle-wandb-sync
```

**PyPI**: https://pypi.org/project/kaggle-wandb-sync/
**GitHub**: https://github.com/yasumorishima/kaggle-wandb-sync

The idea: use `WANDB_MODE=offline` to log everything locally inside Kaggle, then download and sync after the run finishes.

```
Notebook runs offline → download output → wandb sync → W&B cloud
```

## Notebook Setup

Add two lines before importing wandb:

```python
import os
os.environ['WANDB_MODE'] = 'offline'   # must be before import wandb
os.environ['WANDB_PROJECT'] = 'my-project'

import wandb
wandb.init(name="my-run")
# ... your training code ...
wandb.log({"loss": 0.1, "accuracy": 0.95})
wandb.finish()
```

The offline run is saved to Kaggle's output directory automatically.

## Sync with One Command

After the notebook finishes running:

```bash
export WANDB_API_KEY=your_api_key

# Push notebook, wait for completion, download output, sync to W&B
kaggle-wandb-sync run my-competition/
```

Or step by step:

```bash
kaggle-wandb-sync push   my-competition/           # push notebook
kaggle-wandb-sync poll   username/my-competition   # wait for COMPLETE
kaggle-wandb-sync output username/my-competition   # download output
kaggle-wandb-sync sync   ./kaggle_output           # sync to W&B
```

## Log Submission Scores

After submitting to the Kaggle leaderboard, record the score directly to your W&B run:

```bash
kaggle-wandb-sync score https://wandb.ai/me/my-project/runs/abc123 \
  --tm-score 0.17 \
  --rank 779
```

This updates the run summary with `tm_score`, `kaggle_rank`, and automatically sets `submitted: True` (as of v0.1.4).

For other metrics, use `--metric`:

```bash
kaggle-wandb-sync score https://wandb.ai/.../runs/abc123 \
  --metric auc=0.95 \
  --metric logloss=0.32 \
  --rank 42
```

## GitHub Actions Integration

For a fully automated pipeline, add this workflow:

```yaml
name: Kaggle W&B Sync

on:
  workflow_dispatch:
    inputs:
      notebook_dir:
        description: "Notebook directory"
        required: true

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install
        run: pip install kaggle-wandb-sync

      - name: Set up Kaggle credentials
        run: |
          mkdir -p ~/.kaggle
          echo '${{ secrets.KAGGLE_API_TOKEN }}' > ~/.kaggle/kaggle.json
          chmod 600 ~/.kaggle/kaggle.json

      - name: Run pipeline
        env:
          WANDB_API_KEY: ${{ secrets.WANDB_API_KEY }}
        run: kaggle-wandb-sync run ${{ inputs.notebook_dir }}
```

Trigger it from the GitHub Actions UI after your notebook finishes.

## Real-world Example: Stanford RNA 3D Folding 2

I used this to track experiments in [Stanford RNA 3D Folding 2](https://www.kaggle.com/competitions/stanford-rna-3d-folding-2).

The notebook uses template matching — finding similar RNA sequences in the training data and using their 3D coordinates as a starting point.

After submitting, I recorded the score:

```bash
kaggle-wandb-sync score https://wandb.ai/.../runs/hahu4ygj \
  --tm-score 0.17 \
  --rank 779
```

All three experiment versions (baseline, improved, template matching) are now tracked in W&B for easy comparison.

→ Notebook: https://www.kaggle.com/code/yasunorim/template-matching-w-b-via-kaggle-wandb-sync

## Summary

| Command | What it does |
|---|---|
| `run` | Full pipeline (push → poll → output → sync) |
| `push` | Push notebook to Kaggle |
| `poll` | Wait for notebook to finish |
| `output` | Download output files |
| `sync` | Sync offline runs to W&B |
| `score` | Log submission score to W&B run |

```bash
pip install kaggle-wandb-sync
kaggle-wandb-sync run my-competition/
```

Kaggle's internet restriction is no longer a blocker for W&B experiment tracking.
