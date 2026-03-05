---
title: "I Calculated NPB Park Factors for 10 Years — Stadium Renovations Revealed"
published: true
description: "Analyzing 8,619 NPB games (2016–2025) to compute park factors for all 12 stadiums, with special focus on how renovation projects (HR terraces, new stadiums) dramatically shifted the numbers."
tags: python, baseball, datascience, pandas
canonical_url: https://zenn.dev/shogaku/articles/npb-park-factors
cover_image:
---

## What I Built

Using 8,619 NPB (Japanese professional baseball) game scores from 2016–2025, I calculated **Park Factors (PF)** for all 12 stadiums and visualized the year-by-year trends. The key focus: how do stadium renovations change the numbers?

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

---

## What Is a Park Factor?

Park Factor measures how much a stadium affects run scoring compared to a neutral park.

**Formula (Baseball Reference standard):**

```
PF = ((Home RS + Home RA) / Home G)
   / ((Away RS + Away RA) / Away G)

PF > 1.00 : Hitter-friendly (more runs scored)
PF = 1.00 : Neutral
PF < 1.00 : Pitcher-friendly (fewer runs scored)
```

### Why Not Just Use Home Runs Scored?

```python
# ❌ This mixes in the team's offensive strength
pf_bad = home_score / average_score

# ✅ Comparing the SAME team's home vs away performance isolates the park effect
pf = (home_RS + home_RA) / home_G / ((away_RS + away_RA) / away_G)
```

By comparing how the same team performs at home versus away, we isolate the stadium's contribution.

### Why 5-Year Averages?

Single-season PF is noisy (especially for HR). FanGraphs and Baseball Reference typically use 3–5 year aggregates. I calculate both single-year PF and 5-year rolling average (PF_5yr).

---

## The Renovation Problem

Here's a subtle but critical issue: **5-year averages become meaningless if they span a major renovation.**

**Example: Vantelin Dome Nagoya (Chunichi Dragons)**

The 2025 PF_5yr is 0.844 (very pitcher-friendly). But a major HR wing installation is planned for 2026 (reducing left/right-center distance by 6 meters). If we keep including pre-renovation data after 2026, we'd show an artificially low PF for years.

My solution: **renovation breakpoints**. After a major change, only post-renovation data is used for multi-year averages.

```python
# calc_park_factors.py
RENOVATION_BREAKS: dict[str, list[int]] = {
    "ソフトバンク": [2015],        # HR Terrace installed (L/R center -6m)
    "ロッテ":       [2019],        # HR Lagoon installed (L/R center -4m)
    "日本ハム":     [2023],        # New stadium (ES CON Field)
    "楽天":         [2016, 2026],  # 2016: natural grass / 2026: fence moved in
    "中日":         [2026],        # HR Wing installation planned
}

def calc_multiyear_pf(games, team, year, window=5):
    """Use only post-renovation data for multi-year PF calculation"""
    reno = get_renovation_break(team, year)
    data_start = reno if reno else games["year"].min()
    years = list(range(max(year - window + 1, data_start), year + 1))
    # ... aggregate and calculate
```

Rakuten has two renovation breakpoints (2016 and 2026), so both are registered.

---

## The Visualization

![NPB Park Factors Trend 2016-2025](https://raw.githubusercontent.com/yasumorishima/npb-prediction/main/images/npb_park_factors_trend.png)

*Bars: 2025 PF (blue=hitter-friendly, red=pitcher-friendly) / Line: 5-year average PF / Orange vertical line: renovation completed / Purple dotted line: upcoming renovation*

The visualization explicitly shows renovation timing for every stadium that had changes:
- **Orange solid line**: renovation already completed (e.g., ZOZO Marine 2019 HR Lagoon)
- **Purple dotted line**: upcoming renovation (e.g., Vantelin 2026, Rakuten 2026)
- **Annotation**: when renovation was before the data range (e.g., PayPay Dome 2015)

```python
# plot_park_factors.py (excerpt)
for reno_year in breaks:
    if reno_year < DATA_START:
        # Before data range → text annotation on first bar
        ax.text(DATA_START, YLIM[1] - 0.03, f"※{reno_year} renovated", ...)
    elif reno_year > DATA_END:
        # Future renovation → purple dotted line at right edge
        ax.axvline(x=DATA_END + 0.45, color="#9333EA", linestyle=":", ...)
    else:
        # Within data range → orange solid line before the renovation year
        ax.axvline(x=reno_year - 0.5, color="#F97316", linestyle="-", ...)
```

---

## Key Findings

### 1. PayPay Dome (SoftBank) — 2015 HR Terrace converged to neutral

After the 2015 HR Terrace installation (L/R center -6m), the 2016 PF spiked to 1.171. Over 10 years, it gradually converged to PF_5yr=1.007 (2025) — essentially neutral.

| Year | PF | PF_5yr |
|---|---|---|
| 2016 | 1.171 | 1.171 |
| 2018 | 0.969 | 1.009 |
| 2025 | 0.976 | 1.007 |

### 2. ZOZO Marine (Lotte) — HR Lagoon transformed a pitcher's park

| Year | PF | Notes |
|---|---|---|
| 2018 | 0.874 | Pre-renovation (pitcher-friendly) |
| 2019 | 0.923 | HR Lagoon installed |
| 2020 | 1.101 | Immediate jump |
| 2021 | 1.235 | Strongly hitter-friendly |
| 2025 | 1.010 | PF_5yr=1.097 |

The renovation's effect appeared immediately in the following season.

### 3. ES CON Field (Nippon Ham) — New stadium peaked in Year 2

| Year | PF | PF_5yr | Notes |
|---|---|---|---|
| 2022 | 0.949 | 0.967 | Sapporo Dome (last year) |
| 2023 | 0.969 | 0.969 | ES CON Year 1 |
| 2024 | 1.212 | 1.089 | Year 2 surge |
| 2025 | 1.271 | 1.147 | Year 3, continued |

Year 1 was actually pitcher-friendly (right-center field is wide), but PF jumped to 1.212 in Year 2. Players may have needed time to adjust to the dimensions and wall caroms of the new park.

### 4. Vantelin Dome (Chunichi) — Pitcher's paradise for 10 straight years

PF_5yr ranged from 0.773–0.955 across the entire 2016–2025 period. Even the best year was 10%+ below average scoring.

| Year | PF | PF_5yr |
|---|---|---|
| 2016 | 0.773 | 0.773 |
| 2019 | 0.880 | 0.825 |
| 2022 | 0.867 | 0.839 |
| 2025 | 0.955 | 0.844 |

2026 HR Wing installation may change this dramatically — similar to what happened at ZOZO Marine in 2019.

### 5. Rakuten Mobile Park — Two renovations, 2026 is the big one

2016 natural grass conversion showed some effect, but the 5-year average has drifted back to pitcher-friendly territory (PF_5yr=0.908 in 2025). The 2026 fence adjustment could shift this significantly.

---

## 2026 Outlook

Two stadiums are due for major changes:

| Stadium | Renovation | Current PF_5yr | Expected Direction |
|---|---|---|---|
| Vantelin (Chunichi) | HR Wing (+6m closer) | 0.844 | → Hitter-friendly |
| Rakuten Mobile Park | Fence moved in | 0.908 | → More neutral |

The key implication: **Chunichi and Rakuten pitchers may see their ERA rise in 2026, not because of their own performance decline, but because the park changed.**

---

## 2025 Full Stadium Ranking (by PF_5yr)

| Rank | Team | Stadium | 2025 PF | PF_5yr | Character |
|---|---|---|---|---|---|
| 1 | Nippon Ham | ES CON Field | 1.271 | 1.147 | Most hitter-friendly |
| 2 | Swallows | Jingu | 1.096 | 1.129 | Hitter-friendly |
| 3 | DeNA | Yokohama Stadium | 1.184 | 1.102 | Hitter-friendly |
| 4 | Lotte | ZOZO Marine | 1.010 | 1.097 | Hitter-friendly |
| 5 | SoftBank | PayPay Dome | 0.976 | 1.007 | Neutral |
| 6 | Carp | Mazda Stadium | 1.065 | 0.996 | Neutral |
| 7 | Giants | Tokyo Dome | 0.878 | 0.981 | Neutral |
| 8 | Lions | Belluna Dome | 0.923 | 0.962 | Slightly pitcher-friendly |
| 9 | Orix | Kyocera Dome | 0.931 | 0.943 | Slightly pitcher-friendly |
| 10 | Hanshin | Koshien | 0.830 | 0.942 | Slightly pitcher-friendly |
| 11 | Eagles | Rakuten Mobile Park | 0.931 | 0.908 | Pitcher-friendly |
| 12 | Dragons | Vantelin Dome | 0.955 | 0.844 | Most pitcher-friendly |

---

## Single-Year PF Ranking by Year (2016–2025)

Ranked by actual single-year PF each year — cleaner than PF_5yr for year-to-year comparison since multi-year averages mix in pre-renovation data.

| Rank | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1st | DeNA 1.205 | Swallows 1.422 | Swallows 1.319 | Giants 1.193 | Swallows 1.230 | Lotte 1.235 | Eagles 1.121 | Swallows 1.374 | Ham 1.212 | Ham 1.271 |
| 2nd | SB 1.171 | Eagles 1.148 | Lions 1.230 | Lions 1.115 | Lotte 1.164 | Giants 1.201 | Swallows 1.087 | Lotte 1.120 | Swallows 1.166 | DeNA 1.184 |
| 3rd | Swallows 1.127 | DeNA 1.063 | DeNA 1.107 | Swallows 1.085 | DeNA 1.138 | DeNA 1.117 | DeNA 1.073 | Orix 1.089 | DeNA 1.146 | Swallows 1.096 |
| 4th | Lions 1.077 | Orix 1.056 | Giants 1.044 | DeNA 1.062 | Eagles 1.079 | Lions 1.067 | SB 1.044 | Carp 1.056 | Lotte 1.095 | Carp 1.065 |
| 5th | Eagles 1.072 | Giants 1.018 | Eagles 1.013 | SB 1.038 | Lions 1.044 | Ham 1.042 | Giants 1.034 | SB 1.056 | Carp 1.079 | Lotte 1.010 |
| 6th | Carp 1.058 | Lions 1.011 | Ham 0.980 | Ham 1.028 | Giants 1.023 | Hanshin 1.015 | Lotte 1.016 | Hanshin 1.023 | Lions 1.003 | SB 0.976 |
| 7th | Ham 0.996 | Ham 0.932 | SB 0.969 | Orix 0.969 | Orix 0.963 | Swallows 0.978 | Hanshin 0.967 | DeNA 0.993 | SB 1.002 | Dragons 0.955 |
| 8th | Hanshin 0.962 | Lotte 0.921 | Orix 0.963 | Carp 0.958 | Carp 0.941 | SB 0.964 | Carp 0.953 | Ham 0.969 | Giants 0.932 | Orix 0.931 |
| 9th | Giants 0.919 | SB 0.919 | Carp 0.955 | Lotte 0.923 | SB 0.912 | Carp 0.879 | Ham 0.949 | Lions 0.872 | Orix 0.932 | Eagles 0.931 |
| 10th | Orix 0.896 | Carp 0.901 | Lotte 0.874 | Hanshin 0.888 | Dragons 0.862 | Eagles 0.868 | Lions 0.938 | Giants 0.871 | Hanshin 0.868 | Lions 0.923 |
| 11th | Lotte 0.797 | Dragons 0.866 | Hanshin 0.804 | Dragons 0.880 | Hanshin 0.860 | Orix 0.864 | Orix 0.916 | Eagles 0.841 | Eagles 0.814 | Giants 0.878 |
| 12th | Dragons 0.773 | Hanshin 0.863 | Dragons 0.789 | Eagles 0.839 | Ham 0.846 | Dragons 0.806 | Dragons 0.867 | Dragons 0.797 | Dragons 0.803 | Hanshin 0.830 |

Key takeaways:
- **Dragons (Vantelin)** ranked last in 8 of 10 years (only exceptions: 2020, 2021)
- **Swallows (Jingu)** ranked 1st in 4 years (2017, 2018, 2020, 2023), always near the top
- **Lotte (ZOZO Marine)** went from 11th in 2016 to 1st in 2021 — direct result of 2019 HR Lagoon renovation
- **Nippon Ham** went from 12th in 2020 to 1st in 2025 — ES CON Field effect after 2023 move

---

**Code & Data**: https://github.com/yasumorishima/npb-prediction

Data sources: baseball-data.com / npb.jp (raw data not redistributed)

---

## Related Articles

- [Beyond Marcel: Adding Bayesian Regression to NPB Baseball Predictions — A 15-Step Journey](https://zenn.dev/shogaku/articles/npb-bayes-projection-story)
