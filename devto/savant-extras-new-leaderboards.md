---
title: "Park Factors, OAA, and Stuff+ in One Line of Python (savant-extras v0.3.2–v0.4.1)"
published: true
description: "New Python package additions: FanGraphs park factors, Outs Above Average, Outfield Jump, and Stuff+/Location+/Pitching+ — all unavailable in pybaseball."
tags: python, baseball, opensource, pypi
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/savant-extras-new-leaderboards/
---

## What's New in savant-extras

[savant-extras](https://github.com/yasumorishima/savant-extras) is a Python package that fills the gap where [pybaseball](https://github.com/jldbc/pybaseball) leaves off — leaderboards that Baseball Savant and FanGraphs offer but pybaseball doesn't support.

Versions v0.3.2 through v0.4.1 added four new data sources:

| Version | Added |
|---|---|
| v0.3.2 | `park_factors` — FanGraphs ballpark run factors (30 teams, 2015+) |
| v0.3.3 | lxml dependency + StringIO fix for pandas 2.0+ |
| v0.4.0 | `outs_above_average` / `outfield_jump` — Baseball Savant defensive metrics |
| v0.4.1 | `pitcher_quality` — Stuff+ / Location+ / Pitching+ from FanGraphs (2020+) |

```bash
pip install savant-extras
```

---

## Park Factors (v0.3.2)

FanGraphs publishes ballpark run factors for all 30 MLB teams — but there's no clean Python API for it. `park_factors()` scrapes the FanGraphs Guts page and returns a tidy DataFrame.

```python
from savant_extras import park_factors, park_factors_range

# Single season — 30 rows, one per team
df = park_factors(2024)
print(df[df["team"] == "COL"][["team", "pf_5yr", "pf_hr"]])
#    team  pf_5yr  pf_hr
# 5   COL     113    131

# Multi-season — useful for ML feature engineering
df = park_factors_range(2020, 2025)
print(df.shape)  # (180, 12)  — 6 seasons × 30 teams
```

Columns include `pf_5yr` (5-year weighted average, recommended), `pf_3yr`, `pf_1yr`, `pf_hr`, `pf_1b`, `pf_2b`, `pf_3b`, `pf_so`, `pf_bb`, and `pf_fip`. All on a scale where 100 = neutral, >100 = hitter-friendly.

**Use case:** Build a park factor lookup dict for prediction models:

```python
pf_lookup = {
    (int(r.season), str(r.team)): float(r.pf_5yr)
    for _, r in park_factors_range(2020, 2025).iterrows()
}
# pf_lookup.get((2024, "COL"), 100) → 113
```

---

## Outs Above Average (v0.4.0)

OAA measures how many outs a fielder saves compared to what an average fielder would have recorded on the same chances. Baseball Savant provides it, but pybaseball doesn't expose it.

```python
from savant_extras import outs_above_average, outs_above_average_range

df = outs_above_average(2024)
print(df[["last_name", "pos", "outs_above_average", "fielding_runs_prevented"]].head(10))

# Multi-season, infielders only
df = outs_above_average_range(2022, 2024, pos="Infielder")
```

Directional breakdowns are included: `outs_above_average_infront`, `outs_above_average_behind`, `outs_above_average_lateral_toward3bline`, and `outs_above_average_lateral_toward1bline`. Plus `fielding_runs_prevented` for a run-value translation.

---

## Outfield Jump (v0.4.0)

Outfield Jump breaks down an outfielder's first-step reaction into three phases: reaction, burst (acceleration), and routing. Available from 2016 onward.

```python
from savant_extras import outfield_jump, outfield_jump_range

df = outfield_jump(2024)
print(df[["last_name",
          "rel_league_reaction_distance",
          "rel_league_burst_distance",
          "rel_league_bootup_distance"]].head(10))
```

All values are in feet relative to the league average. Positive = better than average. `rel_league_bootup_distance` is the overall Jump score combining all three phases.

---

## Stuff+ / Location+ / Pitching+ (v0.4.1)

This one was tricky. FanGraphs' pitcher quality metrics (type=36) are rendered client-side, so neither the CSV export nor a standard scrape returns data. The solution: FanGraphs embeds the full dataset as Next.js server-side JSON in a `<script id="__NEXT_DATA__">` tag.

```python
import re, json

match = re.search(
    r'<script id="__NEXT_DATA__"[^>]*>([^<]+)</script>',
    resp.text,
)
raw = json.loads(match.group(1))
players = raw["props"]["pageProps"]["dehydratedState"]["queries"][0]["state"]["data"]["data"]
```

The public API is straightforward:

```python
from savant_extras import pitcher_quality, pitcher_quality_range

df = pitcher_quality(2024)
print(df.sort_values("stuff_plus", ascending=False).head(10)[
    ["name", "team", "stuff_plus", "location_plus", "pitching_plus"]
])

# Three seasons
df_multi = pitcher_quality_range(2022, 2024)
df_multi.groupby("season")["stuff_plus"].mean()
```

Per-pitch-type columns are included for each of FA/SI/FC/SL/CU/CH/ST/FS:
- `stuff_fa`, `loc_fa`, `pit_fa` (Four-Seam)
- `stuff_sl`, `loc_sl`, `pit_sl` (Slider)
- … and so on

`mlbam_id` is also returned, making it easy to join with Statcast data:

```python
merged = statcast_df.merge(
    df[["mlbam_id", "season", "stuff_plus", "location_plus"]],
    on=["mlbam_id", "season"],
    how="left",
)
```

---

## Summary

```python
from savant_extras import (
    park_factors, park_factors_range,
    outs_above_average, outs_above_average_range,
    outfield_jump, outfield_jump_range,
    pitcher_quality, pitcher_quality_range,
)
```

| Function | Source | Not in pybaseball |
|---|---|---|
| `park_factors` | FanGraphs guts | ✅ |
| `outs_above_average` | Baseball Savant | ✅ |
| `outfield_jump` | Baseball Savant | ✅ |
| `pitcher_quality` | FanGraphs leaders | ✅ |

- **GitHub**: https://github.com/yasumorishima/savant-extras
- **PyPI**: https://pypi.org/project/savant-extras/
