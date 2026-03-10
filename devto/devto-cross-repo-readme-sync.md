---
title: "Cross-Repo README Sync with GitHub Actions — Push vs Pull Pattern"
published: true
description: "How to automatically sync stats between GitHub repositories using GitHub Actions, HTML comment markers, and a pull-based architecture that avoids PAT permission issues."
tags: githubactions, github, python, automation
cover_image:
canonical_url:
---

## The Problem

When you manage multiple GitHub repositories, you often want to display stats from one repo in another — for example, showing contribution counts in your profile README.

Manually updating these numbers is error-prone. Lists get out of sync, numbers become stale, and you forget to update after changes.

This article covers how to build **cross-repo README sync** with GitHub Actions, and a key architectural decision that saves you from permission headaches.

## Two Approaches: Push vs Pull

### Push: Source repo writes to target

```
Source repo → (PAT) → Update target repo's README
```

- Requires a Personal Access Token (PAT)
- Fine-grained PATs can unexpectedly return 403 even with correct permissions
- PAT management overhead (rotation, scope, etc.)

### Pull: Target repo reads from source

```
Target repo → (GITHUB_TOKEN) → Read source repo's README via API
            → (GITHUB_TOKEN) → Update own README
```

- No PAT needed — `GITHUB_TOKEN` always has write access to its own repo
- Public repo data is readable without any token
- Just add a workflow to the target repo

**Verdict: Pull wins.** It eliminates PAT management entirely.

## Implementation

### 1. HTML Comment Markers

Mark the auto-updated sections in your target README:

```markdown
## Stats

<!-- STATS_START -->(10 PRs / 5 Merged)<!-- STATS_END --> across 3 repositories.
```

Only the content between markers gets replaced — everything else stays untouched.

### 2. Python Sync Script

```python
import base64
import re
import subprocess
import sys
from pathlib import Path

README = Path(__file__).resolve().parent.parent / "README.md"


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    return result.stdout.strip()


def fetch_source_readme(owner: str, repo: str) -> str | None:
    """Fetch README via GitHub API (no token needed for public repos)."""
    output = run([
        "gh", "api",
        f"repos/{owner}/{repo}/contents/README.md",
        "--jq", ".content",
    ])
    if not output:
        return None
    return base64.b64decode(output).decode("utf-8")


def replace_marker(text: str, marker: str, replacement: str) -> str:
    """Replace content between HTML comment markers."""
    pattern = rf"(<!-- {marker}_START -->).*?(<!-- {marker}_END -->)"
    return re.sub(pattern, rf"\1{replacement}\2", text, flags=re.DOTALL)


def parse_stats(source_text: str) -> dict:
    """Extract stats from a markdown summary table."""
    m = re.search(
        r"\| \*\*Total\*\* \|.*?\| \*\*(\d+)\*\* \| \*\*(\d+)\*\*",
        source_text,
    )
    if not m:
        return {}
    return {"total": int(m.group(1)), "merged": int(m.group(2))}


def main():
    source = fetch_source_readme("your-org", "your-source-repo")
    if not source:
        print("Failed to fetch source README", file=sys.stderr)
        sys.exit(1)

    stats = parse_stats(source)
    if not stats:
        print("Failed to parse stats", file=sys.stderr)
        sys.exit(1)

    readme = README.read_text(encoding="utf-8")
    readme = replace_marker(
        readme, "STATS",
        f"({stats['total']} PRs / {stats['merged']} Merged)",
    )
    README.write_text(readme, encoding="utf-8")
    print(f"Updated: {stats['total']} PRs / {stats['merged']} Merged")


if __name__ == "__main__":
    main()
```

### 3. Workflow

```yaml
name: Sync README Stats

on:
  schedule:
    # Run after the source repo's update schedule
    - cron: '30 9 * * 1'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Sync stats from source repo
        env:
          GH_TOKEN: ${{ github.token }}
        run: python scripts/sync_stats.py

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add README.md
          if ! git diff --cached --quiet; then
            git commit -m "docs: sync stats $(date -u +%Y-%m-%d)"
            git push
          fi
```

## Common Pitfalls

### PAT 403 Errors

With the push approach, Fine-grained PATs can return 403 even when configured with "All repositories" and "Contents: Read and write":

```
remote: Permission to user/repo.git denied to user.
fatal: unable to access '...': The requested URL returned error: 403
```

The GitHub Contents API (`-X PUT`) also returns 403. Rather than debugging token permissions, switching to the pull approach is the most reliable fix.

### Cron Timing

If your source repo updates at 09:00 UTC on Mondays, schedule the sync workflow for **09:30 or later**:

```yaml
# Bad: same time as source → may fetch stale data
- cron: '0 9 * * 1'

# Good: after source update completes
- cron: '30 9 * * 1'
```

### Marker Design

Use unique marker names per section to avoid collisions:

```markdown
<!-- PROJECT_STATS_START -->...<!-- PROJECT_STATS_END -->
<!-- BADGE_COUNT_START -->...<!-- BADGE_COUNT_END -->
```

The `replace_marker` function only touches content between markers, so the rest of your README is safe.

## Summary

| Principle | Description |
|---|---|
| **Use pull, not push** | Place the workflow in the target repo, use GITHUB_TOKEN |
| **HTML comment markers** | Isolate auto-updated sections from manual content |
| **Stagger cron schedules** | Run sync after the source has finished updating |
| **Single Source of Truth** | One canonical data source, everything else pulls from it |

This pattern works for any cross-repo data sync — contribution stats, package versions, badge counts, or anything else you want to keep consistent across repositories.
