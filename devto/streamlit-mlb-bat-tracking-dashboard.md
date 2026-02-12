---
title: I Tried Streamlit for the First Time and Built an MLB Bat Tracking Dashboard
published: true
description: How I built a 5-tab Streamlit dashboard using my own OSS library (savant-extras) to visualize Baseball Savant bat tracking data.
tags: streamlit, python, baseball, mlb
cover_image: https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/streamlit-dashboard-top.png
---

## What I Built

I built a web dashboard to visualize MLB bat tracking data from Baseball Savant.

**👉 [MLB Bat Tracking Dashboard](https://yasumorishima-mlb-bat-tracking.streamlit.app/)**

![Dashboard top page](https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/streamlit-dashboard-top.png)

It has 5 tabs:

| Tab | What it shows |
|---|---|
| Leaderboard | Rankings by Bat Speed, Attack Angle, and more |
| Player Comparison | Radar & bar charts comparing up to 6 players |
| WBC Country Strength | Batting & pitching scores for all 20 WBC 2026 nations |
| Team Lineup Builder | Bat tracking metrics for each MLB team's 9-man lineup |
| Monthly Trend | Month-by-month bat speed trend for any player |

It also supports English/Japanese language switching.

---

## Data Source: savant-extras

I used my own OSS library **savant-extras** to fetch the data.

```bash
pip install savant-extras
```

It's a Python library for fetching bat tracking data from Baseball Savant. I built it because the existing `pybaseball` library didn't support date range filtering for this endpoint.

```python
from savant_extras import bat_tracking, bat_tracking_monthly

# Batter bat tracking data for 2025 season
df = bat_tracking(year=2025, player_type="batter")

# Monthly breakdown
df_monthly = bat_tracking_monthly(year=2025)
```

- GitHub: https://github.com/yasumorishima/savant-extras
- PyPI: https://pypi.org/project/savant-extras/

---

## Why I Chose Streamlit

I wanted to share my data analysis in a visual, accessible format. Streamlit caught my eye for three reasons:

- **Pure Python** — no HTML, CSS, or JavaScript needed
- **Free hosting** on Streamlit Community Cloud (just connect your GitHub repo)
- **UI components in one line** — `st.selectbox()`, `st.slider()`, done

For example, this is all you need to add a dropdown to your sidebar:

```python
import streamlit as st

year = st.sidebar.selectbox("Season", [2024, 2025], index=1)
player_type = st.sidebar.selectbox("Player type", ["batter", "pitcher"])
```

---

## Key Implementation Points

### `@st.cache_data` to avoid repeated API calls

Fetching data every time a user interacts with the page would be too slow. `@st.cache_data` caches the result so repeated calls with the same arguments return instantly.

```python
@st.cache_data(ttl=3600)
def load_bat_data(year: int, player_type: str):
    return bat_tracking(year=year, player_type=player_type)
```

### `session_state` to share data across tabs

Streamlit reruns the entire script on every user interaction. To keep data loaded after pressing a button, use `st.session_state`:

```python
if load_btn:
    st.session_state["df_raw"] = load_bat_data(year, player_type)

if "df_raw" in st.session_state:
    df = st.session_state["df_raw"]
```

### `matplotlib-fontja` for Japanese font support

To render Japanese labels in matplotlib charts, I used `matplotlib-fontja`:

```python
import matplotlib_fontja  # noqa: F401  ← just importing this enables Japanese fonts
```

---

## A Problem I Hit: `japanize_matplotlib` Broke on Python 3.13

After deploying to Streamlit Community Cloud, I got this error:

```
File "japanize_matplotlib/japanize_matplotlib.py", line 5, in <module>
    from distutils.version import LooseVersion
ModuleNotFoundError
```

`distutils` was deprecated in Python 3.12 and fully removed in 3.13. I tried pinning the Python version with a `runtime.txt` file (`python-3.11`), but it didn't work — Streamlit Cloud still used 3.13.

The fix was simple: switch to `matplotlib-fontja`, which doesn't use `distutils`.

```diff
- japanize-matplotlib>=1.1
+ matplotlib-fontja
```

---

## Data Caveats

A few things to keep in mind about this dashboard:

- **Only MLB-rostered players** are included. NPB and minor league players are not
- **Name matching has limitations** — spelling variations or shared names may not match correctly
- **WBC 2026 scores are provisional** — rosters are based on Baseball America's February 2025 projections and may differ from actual rosters
- Bat tracking accuracy depends on Baseball Savant's data quality

Please treat the results as a reference, not a definitive source.

---

## Summary

- Used **savant-extras** (my own OSS library) for data fetching
- Built a 5-tab dashboard with **Streamlit**
- Deployed for free on **Streamlit Community Cloud**

Streamlit was easier than I expected. Tabs with `st.tabs()`, accordions with `st.expander()`, column layouts with `st.columns()` — learning just those three got me most of the way there.

If you want to turn your data analysis into something you can actually share, Streamlit is a great option.

---

## Links

- App: https://yasumorishima-mlb-bat-tracking.streamlit.app/
- savant-extras (PyPI): https://pypi.org/project/savant-extras/
- savant-extras (GitHub): https://github.com/yasumorishima/savant-extras
- Baseball Savant: https://baseballsavant.mlb.com/
