---
title: "I Built a Python Package for Every Baseball Savant Leaderboard"
published: true
description: "savant-extras now covers 16 Baseball Savant leaderboards that pybaseball doesn't support — Pitch Movement, Catcher Blocking, Basestealing, Timer Infractions, and more."
tags: python, baseball, opensource, pypi
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/savant-extras-all-leaderboards/
---

## The Problem

[pybaseball](https://github.com/jldbc/pybaseball) is the go-to Python library for Baseball Savant data. But it doesn't cover many of the leaderboards that Baseball Savant offers:

- Pitch Tempo
- Arm Strength
- Pitch Movement
- Catcher Blocking / Throwing / Stance
- Baserunning / Basestealing
- Timer Infractions (pitch clock violations)
- and more

I built **[savant-extras](https://github.com/yasumorishima/savant-extras)** to fill that gap.

## Version History

| Version | Added |
|---|---|
| v0.1.0 | bat_tracking (date range support) |
| v0.2.0 | pitch_tempo, arm_strength |
| v0.3.0 | 13 more leaderboards |
| v0.3.1 | Known Issues documentation |

Currently covers **16 leaderboards, 33 functions**.

## All Supported Leaderboards

| Leaderboard | Function | Category |
|---|---|---|
| Bat Tracking | `bat_tracking()` | Batting |
| Batted Ball | `batted_ball()` | Batting |
| Home Runs | `home_runs()` | Batting |
| Year-to-Year | `year_to_year()` | Batting |
| Pitch Tempo | `pitch_tempo()` | Pitching |
| Pitch Movement | `pitch_movement()` | Pitching |
| Pitcher Arm Angle | `pitcher_arm_angle()` | Pitching |
| Running Game | `running_game()` | Pitching |
| Timer Infractions | `timer_infractions()` | Pitching |
| Arm Strength | `arm_strength()` | Fielding |
| Catcher Blocking | `catcher_blocking()` | Catching |
| Catcher Throwing | `catcher_throwing()` | Catching |
| Catcher Stance | `catcher_stance()` | Catching |
| Baserunning | `baserunning()` | Baserunning |
| Basestealing | `basestealing()` | Baserunning |
| Swing & Take | `swing_take()` | Batting * |

*Swing & Take is excluded from the dataset — Baseball Savant's CSV endpoint currently returns empty data for all years (Known Issue).

## Installation

```bash
pip install savant-extras
```

## Usage Examples

### Bat Tracking

```python
from savant_extras import bat_tracking

df = bat_tracking("2025-04-01", "2025-09-30", min_swings=100)
print(df[["name", "avg_bat_speed", "attack_angle"]].head(5))
```

### Pitch Tempo

```python
from savant_extras import pitch_tempo

df = pitch_tempo(2025)
print(df[["entity_name", "median_seconds_empty"]].head(5))
```

### Pitch Movement

```python
from savant_extras import pitch_movement

df = pitch_movement(2025)
# Top 4-seam fastballs by vertical break
ff = df[df["pitch_type"] == "FF"].sort_values("pitcher_break_z", ascending=False)
print(ff[["last_name, first_name", "avg_speed", "pitcher_break_z", "pitcher_break_x"]].head(5))
```

### Arm Strength

```python
from savant_extras import arm_strength

df = arm_strength(2025)
print(df[["fielder_name", "primary_position_name", "max_arm_strength", "arm_overall"]].head(5))
```

### Catcher Throwing

```python
from savant_extras import catcher_throwing

df = catcher_throwing(2025)
print(df[["player_name", "pop_time", "arm_strength", "caught_stealing_above_average"]].head(5))
```

### Timer Infractions

```python
from savant_extras import timer_infractions

df = timer_infractions(2025)
print(df[["entity_name", "all_violations", "pitcher_timer", "batter_timer"]])
```

## Kaggle Notebook & Dataset

I published a Kaggle Notebook with charts for all 16 leaderboards, and a dataset with 15 CSVs covering the 2024 and 2025 seasons.

- **Notebook**: https://www.kaggle.com/code/yasunorim/savant-extras-all-baseball-savant-leaderboards
- **Dataset (15 CSVs, 2024+2025)**: https://www.kaggle.com/datasets/yasunorim/baseball-savant-leaderboards-2024

## Known Issues

**Swing & Take**: Baseball Savant's CSV endpoint for this leaderboard currently returns header-only data (no rows) for all years. This appears to be an issue on the API side. All other 15 leaderboards work normally.

## Links

- **PyPI**: https://pypi.org/project/savant-extras/
- **GitHub**: https://github.com/yasumorishima/savant-extras
