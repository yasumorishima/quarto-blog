---
title: "Last Place to Champions: What Marcel Projection Reveals About 2021 NPB Yakult and Orix"
published: true
description: "In 2021, both pennant winners came from last place the year before. Using Marcel team projections with roster-verified data, I analyzed why — and found a league-wide reversal that Marcel couldn't see coming."
tags: python, baseball, datascience, machinelearning
canonical_url: https://zenn.dev/shogaku/articles/npb-marcel-lastplace-to-champion
cover_image:
---

## Background

**Marcel projection** predicts next season's performance by taking a weighted average of the past 3 years of individual stats. It's designed to show the continuation of current trends — which means it struggles when teams change dramatically. Projections include only players registered on a team's roster for the target year (players who left for MLB or retired are excluded).

2021 was exactly that kind of year. Both pennant winners came from last place the season before:

- **Tokyo Yakult Swallows**: Last in 2020 → Central League champions in 2021
- **Orix Buffaloes**: Last in 2020 → Pacific League champions in 2021

Using data from my [NPB prediction app](https://npb-prediction.streamlit.app/), I traced how Marcel handled these two teams — and what it couldn't see.

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

---

## What Marcel Said Before the Season

"Marcel projected wins" here means a **pre-season prediction** based on aggregating individual player projections into team run scoring and run prevention, then converting to win% via Pythagorean expectation.

**Yakult**

| Year | Marcel Proj. | Actual W | Gap |
|------|-------------|----------|-----|
| 2019 | 69.5 W | 59 | **-10.5** |
| 2020 | 56.7 W | 41 | **-15.7** |
| **2021** | 66.6 W | **73** | **+6.4** |

**Orix**

| Year | Marcel Proj. | Actual W | Gap |
|------|-------------|----------|-----|
| 2019 | 66.2 W | 61 | **-5.2** |
| 2020 | 55.8 W | 45 | **-10.8** |
| **2021** | 69.7 W | **70** | **+0.3** |

*2020 was a shortened 120-game season*

Two things stand out.

**① Marcel's projection barely changed**

Comparing 2020 to 2021 Marcel projections:
- Yakult: 56.7 W → 66.6 W (~10 win increase reflects 120→143 game schedule recovery)
- Orix: 55.8 W → 69.7 W (same)

The underlying win% estimate was essentially unchanged. Marcel uses a 3-year weighted average, so one last-place season doesn't move the needle much.

**② What changed was the direction of the gap**

- Last-place year: **fell well short** of Marcel projection (-10 to -16 wins)
- Championship year: **matched or exceeded** Marcel projection (Yakult +6.4, Orix +0.3)

The "last place to champions" story wasn't Marcel's projection suddenly rising — it was **the year they actually achieved the level Marcel projected**.

---

## 2021: A League-Wide Reversal Marcel Couldn't See

This wasn't just about two teams. Across all 12 NPB teams in 2021, **the teams Marcel rated as strong collapsed, while teams Marcel rated as weak rose up**. A league-wide reversal happened in both leagues simultaneously.

**Central League (by win percentage)**

| Rank | Team | Marcel Proj. | Actual (W-L-D) | Win% | Gap |
|------|------|-------------|----------------|------|-----|
| 1st | Yakult | 66.6 W | 73-52-18 | .584 | **+6.4** |
| 2nd | Hanshin | 72.9 W | 77-56-10 | .579 | **+4.1** |
| 3rd | Giants | 81.2 W | 61-62-20 | .496 | **-20.2** |
| 4th | Hiroshima | 75.2 W | 63-68-12 | .481 | -12.2 |
| 5th | Chunichi | 69.1 W | 55-71-17 | .437 | -14.1 |
| 6th | DeNA | 69.9 W | 54-73-16 | .425 | **-15.9** |

*Note: Yakult won fewer games than Hanshin (73 vs 77) but had 8 more draws and 4 fewer losses, giving them the higher win percentage for the pennant.*

**Pacific League (by win percentage)**

| Rank | Team | Marcel Proj. | Actual (W-L-D) | Win% | Gap |
|------|------|-------------|----------------|------|-----|
| 1st | Orix | 69.7 W | 70-55-18 | .560 | **+0.3** |
| 2nd | Lotte | 68.3 W | 67-57-19 | .540 | -1.3 |
| 3rd | Rakuten | 71.3 W | 66-62-15 | .516 | -5.3 |
| 4th | SoftBank | 75.1 W | 60-62-21 | .492 | **-15.1** |
| 5th | Nippon Ham | 69.8 W | 55-68-20 | .447 | **-14.8** |
| 6th | Seibu | 68.6 W | 55-70-18 | .440 | **-13.6** |

Marcel's top-rated team — Giants at 81.2 projected wins — finished with 61 wins (-20.2). Marcel's lowest-rated CL team — Yakult at 66.6 — won the pennant. The top 4 CL teams by Marcel projection all collapsed; the bottom 2 rose.

The Pacific told the same story: SoftBank, Nippon Ham, and Seibu (all rated as strong) fell 13–15 wins short. Orix essentially matched their Marcel projection (+0.3) to win the pennant.

"Last place to champions" wasn't a random fluke — it was part of a **systematic league-wide reversal** that Marcel couldn't anticipate.

---

## Why the Gap? Player-Level Factors Marcel Can't See

### Yakult 2021

**Pitching (team ERA: 4.61 → 3.48)**

| Player | Change |
|--------|--------|
| Okugawa Yasunori | 0 innings in 2020 → 105 innings, ERA 3.26 in 2021 ← **outside Marcel's scope** |
| Takahashi Keiji | ERA 3.94 → 2.87 (major improvement) |
| Shimizu Noboru | ERA 3.54 → 2.39 (settled as closer) |
| McGuff | ERA 3.91 → 2.52 (peak performance) |

**Offense (team RS: 468 → 625)**

| Player | Change |
|--------|--------|
| Yamada Tetsuto | OPS (OBP+SLG) .766 → .885 (comeback season) |
| Murakami Munetaka | HR 28→39, maintained OPS |
| Santana | New signing, OPS .877 ← **outside Marcel's scope** |
| Osuna | New signing, OPS .694 ← **outside Marcel's scope** |

### Orix 2021

**Pitching (team RA: 502 → 500, but quality improved dramatically)**

| Player | Change |
|--------|--------|
| Yamamoto Yoshinobu | ERA 2.20 → 1.39, innings 127→194 (full breakout) |
| Miyagi Hiroya | 0 innings in 2020 → 147 innings, ERA 2.51 in 2021 ← **outside Marcel's scope** |
| Tajima Daiki | 143.1 innings of steady contribution |

**Offense (team RS: 442 → 551)**

| Player | Change |
|--------|--------|
| Sugimoto Yutaro | 141 plate appearances, OPS .695 → 542 plate appearances, 32 HR, OPS .931 ← **Marcel underestimated** |
| Yoshida Masataka | OPS .992 — consistently elite |
| So Yuma | Expanded to 543 plate appearances |

---

## The Other Side: What Happened to the Teams That Collapsed

The collapsed teams share a common pattern: **key players Marcel projected at prior-year levels saw their playing time drop sharply**. The numbers tell the same story across teams.

| Team | Player | Marcel Proj. | Actual |
|------|--------|-------------|--------|
| Giants | Nakata Sho | 532 plate appearances | 106 plate appearances |
| Giants | Ino Shoichi | 75 innings | 5 innings |
| Giants | Yo Daikang | 178 plate appearances | 7 plate appearances |
| DeNA | Taira Kentaro | 75 innings | 10 innings |
| DeNA | Higashi Katsuki | 88 innings | 19 innings |
| SoftBank | Valentin | 397 plate appearances | 60 plate appearances |
| SoftBank | Uebayashi Tomonori | 322 plate appearances | 72 plate appearances |
| SoftBank | Senga Kodai | 146 innings | 84 innings |
| Nippon Ham | Ota Taiji | 506 plate appearances | 206 plate appearances |
| Nippon Ham | Kimura Fuminori | 302 plate appearances | 36 plate appearances |
| Seibu | Sotosaki Shuta | 543 plate appearances | 300 plate appearances |
| Seibu | Kaneko Yuji | 404 plate appearances | 220 plate appearances |

Marcel projects forward from registered-roster performance. When players who looked strong in prior seasons couldn't contribute in 2021, the projection ended up above reality.

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
| Yakult | 72.2 W | 57 | **-15.2** |
| Lotte | 66.2 W | 56 | **-10.2** |

Yakult's 2025 gap (-15.2) is nearly identical to their 2020 gap (-15.7).

Marcel 2026 projections:

| Team | Marcel 2026 Proj. |
|------|------------------|
| Yakult | 64.3 W |
| Lotte | 67.1 W |

In 2020→2021, Yakult exceeded their **66.6-win projection by 6.4 wins**. For 2026 Yakult to do the same, they'd need to outperform their 64.3-win projection by roughly 6–10 wins.

**What would need to happen — outside Marcel's scope:**

1. **Young starter with near-zero 2025 innings becomes a rotation anchor** (Okugawa pattern)
2. **Foreign position player has a breakout first season** (Santana pattern)
3. **Existing player surges +200 plate appearances with dramatically improved numbers** (Sugimoto pattern)

Marcel shows where teams stand based on current trends. When multiple "invisible" factors align, actual results can significantly exceed the projection.

---

## Summary

- Marcel projected both teams at roughly 65–70 wins regardless of whether they finished last or won the pennant
- Last-place years: **fell well short** of Marcel projection (players underperformed, playing time dropped)
- Championship years: **matched or exceeded** Marcel projection (factors Marcel couldn't see all aligned)
- "Last place to champions" is less about the projection rising — it's about **whether the invisible factors showed up**
- In 2021, both leagues saw a systematic reversal: Marcel's highest-rated teams collapsed, lower-rated teams rose

Marcel projection reveals the baseline. What it can't show is the breakout rookie, the new foreign star, or the player who finally puts it all together — the exact variables that turn a last-place team into a champion.

---

## Tools and Data

- **Prediction app**: [npb-prediction.streamlit.app](https://npb-prediction.streamlit.app/)
- **GitHub**: [yasumorishima/npb-prediction](https://github.com/yasumorishima/npb-prediction)
- **Data**: [baseball-data.com](https://baseball-data.com/) / [npb.jp](https://npb.jp/)
