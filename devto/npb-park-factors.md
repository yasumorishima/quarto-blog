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

*Bars: single-year PF (blue=hitter-friendly, red=pitcher-friendly) / Line: 5-year average PF / Orange vertical line: renovation completed / Purple dotted line: upcoming renovation*

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

Year 1 was actually pitcher-friendly (right-center field is wide), but PF jumped to 1.212 in Year 2. Players may have needed time to learn the park.

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

| Rank | Team | Stadium | Single-yr PF | PF_5yr | Character |
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

## PF_5yr by Year — All Stadiums (2016–2025)

| Stadium | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|---|---|
| ES CON/Sapporo Dome (Ham) | 0.996 | 0.964 | 0.968 | 0.983 | 0.957 | 0.964 | 0.967 | 0.969 | 1.089 | **1.147** |
| Jingu (Swallows) | 1.127 | **1.254** | **1.277** | **1.221** | **1.222** | **1.189** | **1.130** | **1.132** | **1.153** | 1.129 |
| Yokohama Stadium (DeNA) | **1.205** | 1.129 | 1.122 | 1.108 | 1.113 | 1.095 | 1.097 | 1.076 | 1.094 | 1.102 |
| ZOZO Marine (Lotte) | 0.797 | 0.856 | 0.862 | 0.923 | 1.021 | 1.090 | 1.072 | 1.081 | 1.127 | 1.097 |
| PayPay Dome (SoftBank) | 1.171 | 1.036 | 1.009 | 1.016 | 0.998 | 0.961 | 0.985 | 1.005 | 0.996 | 1.007 |
| Mazda Stadium (Carp) | 1.058 | 0.974 | 0.967 | 0.966 | 0.961 | 0.928 | 0.939 | 0.954 | 0.973 | 0.996 |
| Tokyo Dome (Giants) | 0.919 | 0.967 | 0.992 | 1.045 | 1.041 | 1.098 | 1.100 | 1.067 | 1.008 | 0.981 |
| Belluna Dome (Lions) | 1.077 | 1.043 | 1.111 | 1.113 | 1.102 | 1.102 | 1.098 | 1.023 | 0.986 | 0.962 |
| Kyocera Dome (Orix) | 0.896 | 0.973 | 0.970 | 0.969 | 0.968 | 0.961 | 0.933 | 0.954 | 0.949 | 0.943 |
| Koshien (Hanshin) | 0.962 | 0.910 | 0.870 | 0.875 | 0.873 | 0.881 | 0.901 | 0.949 | 0.948 | 0.942 |
| Rakuten Mobile Park | 1.072 | 1.112 | 1.079 | 1.011 | 1.024 | 0.982 | 0.974 | 0.939 | 0.937 | 0.908 |
| Vantelin Dome (Dragons) | **0.773** | **0.819** | **0.808** | **0.825** | **0.831** | **0.839** | **0.839** | **0.844** | **0.827** | **0.844** |

Key takeaways:
- **Vantelin (Dragons)** ranked last in every single year for 10 years straight
- **Jingu (Swallows)** ranked 1st or 2nd for 9 consecutive years (2016–2024)
- **ZOZO Marine (Lotte)** flipped from worst to top-4 after the 2019 HR Lagoon renovation
- **ES CON Field** surged in its 2nd and 3rd years after opening in 2023

---

**Code & Data**: https://github.com/yasumorishima/npb-prediction

Data sources: baseball-data.com / npb.jp (raw data not redistributed)
