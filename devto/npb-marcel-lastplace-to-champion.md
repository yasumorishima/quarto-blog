---
title: "Last Place to Champions: What Marcel Projection Reveals About 2021 NPB Yakult and Orix"
published: true
description: "In 2021, both pennant winners came from last place the year before. Using Marcel team projections, I analyzed why — and found a league-wide reversal that Marcel couldn't see coming."
tags: python, baseball, datascience, machinelearning
canonical_url: https://zenn.dev/shogaku/articles/npb-marcel-lastplace-to-champion
cover_image:
---

## Background

**Marcel projection** predicts next season's performance by taking a weighted average of the past 3 years of individual stats. It's designed to show the continuation of current trends — which means it struggles when teams change dramatically.

2021 was exactly that kind of year. Both pennant winners came from last place the season before:

- **Tokyo Yakult Swallows**: Last in 2020 → Central League champions in 2021
- **Orix Buffaloes**: Last in 2020 → Pacific League champions in 2021

Using data from my [NPB prediction app](https://npb-prediction.streamlit.app/), I traced how Marcel handled these two teams — and what it couldn't see.

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

---

## What Marcel Said Before the Season

"Marcel projected wins" here means a **pre-season prediction** based on aggregating individual player projections into team run scoring and run prevention, then converting to win% via Pythagorean expectation.

| Team | Year | Marcel Proj. | Actual W | Gap |
|------|------|-------------|----------|-----|
| Yakult | 2019 | 67.8 W | 59 | **-8.8** |
| Yakult | 2020 | 54.4 W | 41 | **-13.4** |
| Yakult | **2021** | 64.2 W | **73** | **+8.8** |
| Orix | 2019 | 64.5 W | 61 | **-3.5** |
| Orix | 2020 | 54.5 W | 45 | **-9.5** |
| Orix | **2021** | 66.6 W | **70** | **+3.4** |

*2020 was a shortened 120-game season*

Two things stand out.

**① Marcel's projection barely changed**

Comparing 2020 to 2021 Marcel projections:
- Yakult: 54.4 W → 64.2 W (~10 win increase reflects 120→143 game schedule recovery)
- Orix: 54.5 W → 66.6 W (same)

The underlying win% estimate was essentially unchanged. Marcel uses a 3-year weighted average, so one last-place season doesn't move the needle much.

**② What changed was the direction of the gap**

- Last-place year: **fell well short** of Marcel projection (-10 to -13 wins)
- Championship year: **exceeded** Marcel projection (+3 to +9 wins)

The "last place to champions" story wasn't Marcel's projection suddenly rising — it was **the year they actually achieved the level Marcel projected**.

---

## 2021: A League-Wide Reversal Marcel Couldn't See

This wasn't just about two teams. Across all 12 NPB teams in 2021, **the teams Marcel rated as strong collapsed, while teams Marcel rated as weak rose up**. A league-wide reversal happened in both leagues simultaneously.

**Central League (by win percentage)**

| Rank | Team | Marcel Proj. | Actual (W-L-D) | Win% | Gap |
|------|------|-------------|----------------|------|-----|
| 1st | Yakult | 64.2 W | 73-52-18 | .584 | **+8.8** |
| 2nd | Hanshin | 72.3 W | 77-56-10 | .579 | **+4.7** |
| 3rd | Giants | 81.5 W | 61-62-20 | .496 | **-20.5** |
| 4th | Hiroshima | 75.9 W | 63-68-12 | .481 | -12.9 |
| 5th | Chunichi | 68.7 W | 55-71-17 | .437 | -13.7 |
| 6th | DeNA | 72.3 W | 54-73-16 | .425 | **-18.3** |

*Note: Yakult won fewer games than Hanshin (73 vs 77) but had 8 more draws and 4 fewer losses, giving them the higher win percentage for the pennant.*

**Pacific League (by win percentage)**

| Rank | Team | Marcel Proj. | Actual (W-L-D) | Win% | Gap |
|------|------|-------------|----------------|------|-----|
| 1st | Orix | 66.6 W | 70-55-18 | .560 | **+3.4** |
| 2nd | Lotte | 66.7 W | 67-57-19 | .540 | +0.3 |
| 3rd | Rakuten | 72.9 W | 66-62-15 | .516 | -6.9 |
| 4th | SoftBank | 74.8 W | 60-62-21 | .492 | **-14.8** |
| 5th | Nippon Ham | 70.0 W | 55-68-20 | .447 | **-15.0** |
| 6th | Seibu | 71.5 W | 55-70-18 | .440 | **-16.5** |

Marcel's top-rated team — Giants at 81.5 projected wins — finished with 61 wins (-20.5). Marcel's lowest-rated CL team — Yakult at 64.2 — won the pennant. The top 4 CL teams by Marcel projection all collapsed; the bottom 2 rose.

The Pacific told the same story: SoftBank, Seibu, and Nippon Ham (all rated as strong) fell 14–16 wins short. Marcel's lowest-rated PL team, Orix, won the pennant.

"Last place to champions" wasn't a random fluke — it was part of a **systematic league-wide reversal** that Marcel couldn't anticipate.

---

## Why the Gap? Player-Level Factors Marcel Can't See

### Yakult 2021

**Pitching (team ERA: 4.61 → 3.48)**

| Player | Change |
|--------|--------|
| Okugawa Yasunori | 0 IP in 2020 → 105 IP, ERA 3.26 in 2021 ← **outside Marcel's scope** |
| Takahashi Keiji | ERA 3.94 → 2.87 (major improvement) |
| Shimizu Noboru | ERA 3.54 → 2.39 (settled as closer) |
| McGuff | ERA 3.91 → 2.52 (peak performance) |

**Offense (team RS: 468 → 625)**

| Player | Change |
|--------|--------|
| Yamada Tetsuto | OPS .766 → .885 (comeback season) |
| Murakami Munetaka | HR 28→39, maintained OPS |
| Santana | New signing, OPS .877 ← **outside Marcel's scope** |
| Osuna | New signing, OPS .694 ← **outside Marcel's scope** |

### Orix 2021

**Pitching (team RA: 502 → 500, but quality improved dramatically)**

| Player | Change |
|--------|--------|
| Yamamoto Yoshinobu | ERA 2.20 → 1.39, IP 127→194 (full breakout) |
| Miyagi Hiroya | 0 IP in 2020 → 147 IP, ERA 2.51 in 2021 ← **outside Marcel's scope** |
| Tajima Daiki | 143.1 IP of steady innings |

**Offense (team RS: 442 → 551)**

| Player | Change |
|--------|--------|
| Sugimoto Yutaro | 141 PA, OPS .695 → 542 PA, 32 HR, OPS .931 ← **Marcel underestimated** |
| Yoshida Masataka | OPS .992 — consistently elite |
| So Yuma | Expanded to 543 PA |

---

## Three Patterns Marcel Can't See

| Pattern | Examples | How Marcel handles it |
|---------|----------|----------------------|
| **Young ace sudden emergence** | Okugawa, Miyagi | Zero prior innings → excluded from calculation |
| **Foreign player hitting it big** | Santana, Osuna | No NPB data → excluded from calculation |
| **Mid-career breakout** | Sugimoto, Takahashi | Dragged down by prior low numbers → underestimated |

Marcel projects the **continuation of current trends**. All three of these patterns represent changes that are invisible in prior-year data — Marcel's greatest weakness.

---

## What This Means for 2026

Two teams in 2025 show a similar pattern:

| Team | Marcel 2025 Proj. | Actual 2025 | Gap |
|------|------------------|-------------|-----|
| Yakult | 69.8 W | 57 | **-12.8** |
| Lotte | 65.0 W | 56 | **-9.0** |

Yakult's 2025 gap (-12.8) is nearly identical to their 2020 gap (-13.4).

Marcel 2026 projections:

| Team | Marcel 2026 Proj. |
|------|------------------|
| Yakult | 64.3 W |
| Lotte | 67.1 W |

In 2020→2021, Yakult exceeded their **64-win projection by 9 wins**. For 2026 Yakult to do the same, they'd need to outperform their 64.3-win projection by roughly 10 wins.

**What would need to happen — outside Marcel's scope:**

1. **Young starter with near-zero 2025 innings becomes a rotation anchor** (Okugawa pattern)
2. **Foreign position player has a breakout first season** (Santana pattern)
3. **Existing player surges +200 PA with dramatically improved numbers** (Sugimoto pattern)

Marcel shows where teams stand based on current trends. When multiple "invisible" factors align, actual results can significantly exceed the projection.

---

## Summary

- Marcel projected both teams at roughly 64–67 wins regardless of whether they finished last or won the pennant
- Last-place years: **fell well short** of Marcel projection (players underperformed, injuries)
- Championship years: **exceeded** Marcel projection (factors Marcel couldn't see all aligned)
- "Last place to champions" is less about the projection rising — it's about **whether the invisible factors showed up**
- In 2021, both leagues saw a systematic reversal: Marcel's highest-rated teams collapsed, lowest-rated teams rose

Marcel projection reveals the baseline. What it can't show is the breakout rookie, the new foreign star, or the player who finally puts it all together — the exact variables that turn a last-place team into a champion.

---

## Tools and Data

- **Prediction app**: [npb-prediction.streamlit.app](https://npb-prediction.streamlit.app/)
- **GitHub**: [yasumorishima/npb-prediction](https://github.com/yasumorishima/npb-prediction)
- **Data**: [baseball-data.com](https://baseball-data.com/) / [npb.jp](https://npb.jp/)
