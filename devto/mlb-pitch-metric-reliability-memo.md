---
title: Does a pitch's performance carry over to next season? Whiff rate vs run value on 8,022 MLB pairs
published: true
description: I used public Baseball Savant data to see how strongly each pitch metric carries over from one season to the next, then rebuilt run value from pitch-level data to see which parts carry over.
tags: baseball, datascience, dbt, duckdb
---

While looking at pitch-type stats on Baseball Savant, I started wondering: if a pitch missed a lot of bats one year, does it still miss bats the next year? If a pitch was hard to hit one year, is it still hard to hit the next?

A good number in one season could mean the pitch is genuinely good, or it could mean it was just a good year, and that probably depends on the metric. So I checked with public MLB data. I have no professional baseball experience; I just aggregated public data.

## Data and how the seasons are compared

- **Pitch-type stats**: Baseball Savant's pitch arsenal table (pitcher x pitch type x season), 2017–2025
- **Pitch-level data**: about 5.98 million pitches from Savant's Statcast Search (used later to split run value)

The comparison is simple. **The same pitcher's same pitch type in two consecutive seasons is one pair**, for example one pitcher's 2023 slider and his 2024 slider, and I take the correlation between season 1 and season 2. Only pairs with 100+ pitches in both seasons are used: **8,022 pairs**.

Compared as is, the correlation would be inflated just because sliders miss more bats than sinkers no matter who throws them. What I want is "is this slider good among sliders", so I first **subtract that season's average for that pitch type**.

In SQL the pairs look like this. It is simplified for the post; the real thing is a dbt model (`mart_scouting_reliability`) that also leaves out the season in progress, among other things.

```sql
with a as (
    select player_id, season, pitch_type, pitches, whiff_rate,
           whiff_rate - avg(whiff_rate) over (partition by season, pitch_type) as w
    from pitch_arsenal
    where pitches >= 100
)
select least(x.pitches, y.pitches) as min_pitches, x.w as w1, y.w as w2
from a x
join a y on y.player_id = x.player_id
        and y.pitch_type = x.pitch_type
        and y.season = x.season + 1
```

Small samples are noisy, so the pairs are split into four bands by **the smaller of the two seasons' pitch counts**, and `corr(w1, w2)` is computed per band.

## Whiff rate carries over; run value does not

![Whiff rate carries over; run value does not](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_1_en.png)

Every metric carries over more with more pitches, but **the gap between metrics is larger than the gap between sample sizes**. Whiff rate with only 100–199 pitches (0.53) carries over more than run value with 800+ (0.35).

For the 1,962 pairs with 400+ pitches in both seasons, the year-to-year correlation is 0.70 for whiff rate and 0.27 for run value. This is what that difference looks like, one dot per pair:

![Correlation 0.70 vs 0.27](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_6_en.png)

For whiff rate, most pitches that were above average in season 1 are above average again in season 2, and the dots form a rising band. For run value, a pitch above average in season 1 can land almost anywhere in season 2; the cloud is nearly round.

## How often the top pitches stay on top

Correlations are hard to picture, so I also counted it another way: rank each season's pitches (after subtracting the pitch-type average) and see how many of the top 20% are still in the top 20% next season. If the two seasons were unrelated, it would be about 20%.

![Share of top-20% pitches still top 20% next season](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_2_en.png)

With 400+ pitches in both seasons, about one in three top-20% run value pitches stayed in the top 20%, and 36% dropped to the bottom half (about 50% if unrelated). For whiff rate, only 12% dropped to the bottom half.

## How many pitches until half of a season is signal

If one season's number is "the pitch's true level + noise", then with n pitches the true level is roughly `n / (n + k)` of it, where k is the pitch count at which it is half signal, half noise. "Signal" here just means the part that is not chance.

The true level itself also changes a little from year to year. If c (at most 1) is how stable it is, the year-to-year correlation is c times the geometric mean of the two seasons' signal shares.

A reader suggested this model in a comment on this post, estimating k from the band midpoints. Here I sorted the 8,022 pairs by pitch count into 12 equal-size groups and searched for the c and k that best fit each group's correlation, using the actual pitch counts of the pairs in the group (weighted by group size):

```python
# expected correlation for one group of pairs with pitch counts n1, n2
r_pred = c * np.mean(np.sqrt(n1 / (n1 + k) * n2 / (n2 + k)))
```

![Pitches until half signal](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_8_en.png)

- Whiff rate: **about 100 pitches** (95% interval from 100 resamples of pitchers: 70–130)
- xwOBA allowed: about 300 (180–470)
- Run value: **about 1,800** (at least 600)

A starter's main pitch over a full season is about 1,100 pitches (median of the most-used pitch of the 316 pitcher-seasons with 2,400+ pitches in 2021–2025). So by this fit, even a full season of run value may not reach half signal, while whiff rate gets there with about 100 pitches.

Only run value has a wide interval, because within the pitch counts in this data (at most about 2,300 for one pitch in one season), c and k cannot be told apart well. In 37 of the 100 resamples c sat at its cap of 1, so the upper end (about 2,300) is set largely by that cap; what the data supports is "at least 600".

The comment put run value's k at about 700. The bands use the smaller of the two seasons' pitch counts, so the other season had more pitches than that; fitting with both seasons' counts gives a larger k.

## Splitting run value into parts

Why does run value carry over so little? I went down to pitch-level data.

According to the [MLB glossary](https://www.mlb.com/glossary/statcast/run-value), run value adds up, pitch by pitch, how much each result (ball, strike, hit, out and so on) moved the expected runs. Pitch-level data carries that value as `delta_run_exp` (positive favors the batter). Summing it by pitcher, pitch type and season, flipping the sign and rounding to an integer **matches Savant's published pitch-type run value on 99.2–99.7% of rows in every season**. The rest differ by 1, and all of them have a fractional part near 0.5, where the rounding rule decides.

I then split each pitch's value into five parts that add back exactly to run value:

- **Mid-PA pitches**: pitches that did not end the plate appearance (balls, strikes, fouls), the value of the count change
- **K / BB / HBP**: plate appearances ending in a strikeout, walk or hit-by-pitch
- **Batted-ball quality**: for balls in play, the value expected from exit velocity and launch angle (xwOBA) and the count
- **Batted-ball luck**: for balls in play, actual minus expected: the same contact can be an out at a fielder or a hit through a gap
- **Base/out situation**: the same count and result is worth different amounts with different runners and outs

The first four use values averaged over runners and outs: the mean over all pitches with the same season, count and result, and for batted-ball quality, the mean over batted balls with the same season, count and xwOBA (in 0.05 steps). "Result" is the plate appearance outcome (strikeout, single and so on) for a pitch that ended it, and the pitch call (ball, swinging strike and so on) otherwise.

The core of it looks like this (simplified: it leaves out batted balls without an xwOBA, the final sign flip to the pitcher's side and so on):

```python
# mean by season, count and result = value averaged over runners and outs
P["cn"] = P.groupby(["season", "balls", "strikes", "result"]).delta_run_exp.transform("mean")
# for batted balls, the mean by season, count and xwOBA step is the "expected" value
P["cn_exp"] = P[bip].groupby(["season", "balls", "strikes", "xwoba_bin"]).cn.transform("mean")

P["midpa"]     = np.where(~end_of_pa, P.cn, 0)          # mid-PA pitches
P["pa_nonbip"] = np.where(end_of_pa & ~bip, P.cn, 0)    # K / BB / HBP
P["bip_exp"]   = np.where(bip, P.cn_exp, 0)             # batted-ball quality
P["bip_luck"]  = np.where(bip, P.cn - P.cn_exp, 0)      # batted-ball luck
P["situation"] = P.delta_run_exp - P.cn                 # base/out situation
```

### One pitch at a time

To see what the split shows, I picked two top run value pitches of 2021 whose makeup differs clearly, and put them next to 2022. These are season totals in runs, not relative to the pitch-type average.

![Two top pitches of 2021, built very differently](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_7_en.png)

Adam Wainwright's sinker: +13 of its +20 runs in 2021 were batted-ball luck. Its whiff rate was 9.8%, below the 2021 sinker average (15.5%). In 2022 luck was still positive (+11), but batted-ball quality fell to −18, and the total was 0.

Corbin Burnes's cutter: in 2021 batted-ball luck was negative (−7), and strikeouts/walks plus mid-PA pitches alone were worth +34. In 2022 those two fell to +26, but luck swung to +11 and batted-ball quality was −10, so the total was +27.

For one pitch in one season, even the parts that rarely carry over sometimes do and sometimes don't. Two hand-picked examples prove nothing, so here are all the pitches.

### All pitches

Pairs with 400+ pitches in both seasons (1,962 pairs), per 100 pitches, after subtracting the pitch-type average.

![Run value breakdown](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_3_en.png)

Each part's share of one season's run value variation (covariance of the part with run value divided by the variance of run value; the five add to 100%). Batted-ball luck is 27% and base/out situation 4%, about 30% together.

![Batted-ball luck and situation barely carry over](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_4_en.png)

Year-to-year correlation of each part alone. Batted-ball luck (0.06) and situation (−0.03) barely carry over; K / BB / HBP (0.57) and mid-PA pitches (0.60) carry over well. Those two are only about 30% of one season's variation, but about 70% of the "high this year, high next year" link comes from them.

## Dropping luck and situation predicts next season better

So I tried predicting next season's run value from the three parts that remain after dropping luck and situation. The prediction was fit on pairs whose second season is 2021 or earlier and checked on pairs whose second season is 2022 or later, so it is tested on years it did not see.

![Dropping luck and situation predicts next season better](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_5_en.png)

Just adding up the three parts correlates better with next season than this season's run value itself (0.29 → 0.35). Resampling pitchers 2,000 times, the 95% interval of that difference is 0.03 to 0.10 and does not include 0. Pairs with 100–399 pitches go the same way (0.12 → 0.18), though both are low.

## Summary

In this data:

- Whiff rate carries over well, and about 100 pitches are enough for half of a season's number to be signal
- Run value carries over little in one season; it takes at least 600 pitches, about 1,800 by the fit, to reach half signal
- About 30% of one season's run value variation is batted-ball luck and base/out situation, which barely carry over
- Adding up the other three parts predicts next season's run value better (0.29 → 0.35)

My personal take: when looking at one season of run value, it seems useful to look at whiff rate and strikeouts/walks alongside it to think about the next season.

## Appendix

**Terms**

- Whiff rate: share of swings that miss
- xwOBA allowed: the value of plate appearances ending on that pitch, with batted balls replaced by their expected value from exit velocity and launch angle
- Run value: the sum, pitch by pitch, of how much each pitch moved the expected runs (positive favors the pitcher)

**Caveats**

- The correlations mix random noise and real change in the pitch (a new grip, lost velocity and so on)
- Bands use the smaller of the two seasons' pitch counts, so a band also holds pairs where one season had many more pitches
- Pairs touching the 60-game 2020 season are included
- Pitchers who stopped pitching (or threw fewer than 100 of that pitch) after a bad year form no pair. That removes low first-season values, so the correlations may be slightly low
- Savant's pitch arsenal table counts knuckle curves and slow curves as curveballs, and the pitch-level data follows it
- Batted-ball luck is only actual minus expected from exit velocity, launch angle and count; defense and park are not separated out
- The five-part split is my own choice; for example, whether the count is used in the batted-ball expectation moves the line between quality and luck a little

**Code**

The correlations are built with dbt, with a test that computes the same table another way. The run value split is computed with pandas from pitch-level data.

https://github.com/yasumorishima/mlb-data-pipeline
