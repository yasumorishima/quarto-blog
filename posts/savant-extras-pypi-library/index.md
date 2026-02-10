---
title: "I built savant-extras: Date Range Support for Baseball Savant Data"
published: true
description: "pybaseball only supports full-season leaderboards. savant-extras adds date range support for monthly splits, first/second half comparisons, and more."
tags: python, baseball, opensource, pypi
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/savant-extras-pypi-library/
---

## The Problem

[pybaseball](https://github.com/jldbc/pybaseball) is the go-to Python library for accessing Baseball Savant data. It provides dozens of functions for Statcast pitch-level data, leaderboards, fielding metrics, and more.

However, all of pybaseball's leaderboard functions share a common limitation:

**They only support full-season data.**

```python
# pybaseball: full season only
from pybaseball import statcast_batter_bat_tracking

df = statcast_batter_bat_tracking(year=2024)  # entire 2024 season
# Can't filter to just April, or first half, or any custom date range
```

Want to compare a player's bat speed in April vs. September? Analyze first-half vs. second-half performance? Look at pre-trade vs. post-trade numbers? pybaseball can't do it.

## The Solution: savant-extras

I built [savant-extras](https://github.com/yasumorishima/savant-extras) — a Python library that adds **date range support** for Baseball Savant's bat tracking leaderboard.

It's designed as a complement to pybaseball, not a replacement. Use pybaseball for pitch-level Statcast data, and savant-extras when you need leaderboard data for custom date ranges.

Bat tracking data (Hawk-Eye) is available from the **2024 season onward**.

## Installation

```bash
pip install savant-extras
```

## Usage

### 1. `bat_tracking()` — Custom Date Range

```python
from savant_extras import bat_tracking

# April 2024 batter data
df = bat_tracking("2024-04-01", "2024-04-30")
print(df[["name", "avg_bat_speed", "attack_angle", "competitive_swings"]].head(5))
```

Output:

```
                 name  avg_bat_speed  attack_angle  competitive_swings
0  Stanton, Giancarlo      80.776081      7.886978                 135
1         Cruz, Oneil      77.538084      9.574513                 127
2    Robert Jr., Luis      77.198599     11.955779                  12
3     Schwarber, Kyle      77.093025     14.716905                 167
4       Chapman, Matt      77.088279      5.304906                 153
```

You can also get the pitcher perspective:

```python
# Pitcher bat tracking, April-June 2024
df = bat_tracking("2024-04-01", "2024-06-30", player_type="pitcher")
print(df[["name", "avg_bat_speed", "competitive_swings"]].head(5))
```

Output:

```
              name  avg_bat_speed  competitive_swings
0      Buttó, José      72.870642                 254
1        Sears, JP      72.681473                 577
2     Snell, Blake      72.646426                 182
3  Walker, Taijuan      72.646226                 298
4    Pérez, Martín      72.557050                 402
```

### 2. `bat_tracking_monthly()` — Season-Long Monthly Splits

Fetches bat tracking data for each month of the season (April–October) and adds a `month` column.

```python
from savant_extras import bat_tracking_monthly

df = bat_tracking_monthly(2024, min_swings=1)

# Stanton's monthly bat speed trend
stanton = df[df["name"] == "Stanton, Giancarlo"]
print(stanton[["month", "avg_bat_speed", "competitive_swings"]])
```

Output:

```
   month  avg_bat_speed  competitive_swings
       4      80.776081                 135
       5      80.548995                 148
       6      81.011443                 137
       7      82.736527                  18
       8      81.483215                 133
       9      82.096844                 143
```

Stanton's bat speed increased from 80.5 in May to 82.1 in September — a noticeable in-season improvement.

You can also compute league-wide averages:

```python
print(df.groupby("month")["avg_bat_speed"].mean())
```

### 3. `bat_tracking_splits()` — First Half / Second Half

Splits the season at the All-Star break (approximated as July 13/14).

```python
from savant_extras import bat_tracking_splits

splits = bat_tracking_splits(2024)
first = splits["first_half"]
second = splits["second_half"]

# Stanton's splits
s1 = first[first["name"] == "Stanton, Giancarlo"]
s2 = second[second["name"] == "Stanton, Giancarlo"]

print(f"First half:  {s1['avg_bat_speed'].values[0]:.1f} mph ({s1['competitive_swings'].values[0]:.0f} swings)")
print(f"Second half: {s2['avg_bat_speed'].values[0]:.1f} mph ({s2['competitive_swings'].values[0]:.0f} swings)")
```

Output:

```
First half:  80.8 mph (420 swings)
Second half: 81.9 mph (294 swings)
```

Stanton's bat speed was 1.1 mph faster in the second half.

## Use Cases

### Slump / Hot Streak Analysis

Compare bat tracking metrics during a cold stretch vs. a hot month:

```python
hot = bat_tracking("2024-05-01", "2024-05-31")
cold = bat_tracking("2024-08-01", "2024-08-31")
```

### Pre-Trade vs. Post-Trade

Evaluate a player's performance before and after the trade deadline (July 30):

```python
before = bat_tracking("2024-04-01", "2024-07-29")
after = bat_tracking("2024-07-30", "2024-09-30")
```

### Early Season vs. Late Season

See how the league adjusts over the course of a season:

```python
early = bat_tracking("2024-04-01", "2024-04-30")
late = bat_tracking("2024-09-01", "2024-09-30")
```

## pybaseball vs. savant-extras

| | pybaseball | savant-extras |
|---|---|---|
| Full season data | ✅ | ✅ |
| Monthly splits | ❌ | ✅ |
| First/second half | ❌ | ✅ |
| Custom date range | ❌ | ✅ |
| Pre/post trade | ❌ | ✅ |

## Technical Notes

- Uses the same public CSV endpoint as pybaseball (Baseball Savant leaderboard)
- Issues a warning when querying dates before 2024 (Hawk-Eye data not available)
- `bat_tracking_monthly()` includes a 1-second sleep between requests to avoid overwhelming the server
- Returns an empty DataFrame when the response is HTML or empty

## Links

- **PyPI**: https://pypi.org/project/savant-extras/
- **GitHub**: https://github.com/yasumorishima/savant-extras
- **pybaseball**: https://github.com/jldbc/pybaseball
