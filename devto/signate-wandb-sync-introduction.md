---
title: "Track SIGNATE Competition Scores with W&B: signate-wandb-sync"
published: true
description: "signate-wandb-sync is a PyPI CLI tool that records SIGNATE competition scores to W&B runs, completing the experiment tracking pipeline alongside signate-deploy."
tags: python, machinelearning, wandb, cli
canonical_url: https://zenn.dev/shogaku/articles/signate-wandb-sync-introduction
cover_image:
---

## Background

I previously built [signate-deploy](https://dev.to/yasumorishima/automate-signate-competition-submissions-with-a-cli-tool-signate-deploy-1234) — a CLI tool to automate SIGNATE competition submissions via GitHub Actions.

The missing piece was experiment tracking: after submitting, there was no easy way to record the SIGNATE score back into W&B alongside the training metrics.

So I built a companion tool.

## signate-wandb-sync

```bash
pip install signate-wandb-sync
```

**PyPI**: https://pypi.org/project/signate-wandb-sync/
**GitHub**: https://github.com/yasumorishima/signate-wandb-sync

Records SIGNATE submission scores to W&B run summaries with a single command.

## The Full Pipeline

Combined with `signate-deploy`, the complete workflow looks like this:

```
[GitHub Actions]
  1. Download data via SIGNATE API (signate-deploy)
  2. Run train.py — W&B run created, metrics logged
  3. Submit to SIGNATE (signate-deploy)
  → W&B run URL printed to Actions log

[Local]
  4. Check score on SIGNATE leaderboard
  5. Record score to W&B with signate-wandb-sync
```

### Add W&B to train.py

A few lines in your training script:

```python
import wandb

run = wandb.init(
    project="my-signate-project",
    config={"model": "...", "params": "..."},
)

# ... training and inference ...

wandb.log({"oof_score": oof_score})

print(f"W&B run URL: {run.url}")  # visible in Actions log
wandb.finish()
```

Set `WANDB_API_KEY` as a GitHub Secret and pass it to the training step:

```yaml
- name: Train and predict
  env:
    WANDB_API_KEY: ${{ secrets.WANDB_API_KEY }}
  run: python train.py
```

### Record the score

After checking your score on the SIGNATE leaderboard:

```bash
signate-wandb-sync score https://wandb.ai/your-entity/your-project/runs/abc123 \
    --score 0.85 --rank 3
```

Output:

```
Updated run: my-run-name (your-entity/your-project/abc123)
  submitted = True
  signate_score = 0.85
  signate_rank = 3
```

## Options

| Option | Description |
|---|---|
| `--score` | SIGNATE submission score (float) |
| `--rank` | Leaderboard rank (int) |
| `--metric KEY=VALUE` | Additional metric, repeatable |
| `--project entity/project` | Required when using bare run ID |

```bash
# Log extra metrics alongside score
signate-wandb-sync score <W&B URL> \
    --score 0.85 --rank 3 \
    -m fbeta=0.85 -m recall=0.91
```

## run_id formats

```bash
# Full URL (recommended — copy from Actions log)
signate-wandb-sync score https://wandb.ai/entity/project/runs/abc123 --score 0.85

# Path format
signate-wandb-sync score entity/project/abc123 --score 0.85

# Bare ID (requires --project)
signate-wandb-sync score abc123 --project entity/project --score 0.85
```

## Windows note

```bash
PYTHONUTF8=1 signate-wandb-sync score <W&B URL> --score 0.85
```

## Summary

```bash
pip install signate-deploy signate-wandb-sync
```

- **signate-deploy**: Automate data download, training, and submission on GitHub Actions
- **signate-wandb-sync**: Record submission scores back to W&B

Together, they close the loop on experiment tracking for SIGNATE competitions.

**PyPI**: https://pypi.org/project/signate-wandb-sync/
**GitHub**: https://github.com/yasumorishima/signate-wandb-sync
