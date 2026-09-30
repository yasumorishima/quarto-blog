---
title: "Asking a Decision-Only AI (TypeSafe Jev) to Forecast Next Season's Hitting: Worth About 20 to 50 Training Examples"
published: true
description: A pre-registered test of TypeSafe Jev forecasting MLB hitters' 2026 wOBA change from anonymized 2025 lines, against a Marcel-style rule and models fitted on past examples
tags: baseball, mlb, machinelearning, datascience
---

[TypeSafe Jev](https://docs.typesafe.ai) is a decision-only model: it does not write text, it returns typed answers with probabilities. You can ask for a yes/no probability (Noul), probabilities over choices (Choice) or over ordered levels (Score).

If it answers with probabilities, could it help with baseball's "what happens next year" questions? I wanted to know how often it is right and where it goes wrong, so I tried it on public MLB data. I have no experience working in baseball; I just tallied up public data.

## How to call Jev

Jev is available through OpenRouter. All 697 calls used for evaluation in the two studies below fit in a new account's free allowance (no card, balance left at $0; the costs returned by the API add up to about $0.019 = 0.0107 + 0.0080).

A call sends a `state` describing the situation and typed `questions`:

```python
body = {
    "model": "typesafe/jev-1.13",
    "state": {"context": "An anonymous MLB hitter's 2025 regular season. ...",
              "wOBA": 0.315, "xwOBA": 0.33, "strikeout_rate_pct": 19},   # excerpt
    "questions": {
        "delta_bin": {"type": "score",
                      "instructions": "How will this hitter's wOBA in 2026 compare with his 2025 wOBA?",
                      "criteria": ["Big drop: ...", "Small drop: ...", "About the same: ...",
                                   "Small rise: ...", "Big rise: ..."]},
    },
}
req = urllib.request.Request("https://openrouter.ai/api/alpha/decisions",
                             data=json.dumps(body).encode(), method="POST",
                             headers={"Authorization": f"Bearer {key}",
                                      "Content-Type": "application/json"})
resp = json.load(urllib.request.urlopen(req, timeout=30))
probs = [resp["answers"]["delta_bin"]["probabilities"][str(k)] for k in range(5)]
```

What comes back is only the probabilities, like `{"0": 0.02, "1": 0.32, ...}`, with no explanation.

Code, pre-registrations and every Jev answer are in [yasumorishima/jev-baseball](https://github.com/yasumorishima/jev-baseball).

## First study: will an ABS challenge be overturned?

I first asked whether an ABS challenge (a player disputing a ball/strike call) would be overturned. Every challenge has a known answer, so the probabilities are easy to score.

### Building the data

In MLB StatsAPI game feeds (`feed/live`), a challenged pitch carries `reviewDetails`. From 777 games in August and September 2026 I extracted 2,678 pitch challenges (`reviewType == "MJ"`).

Two things needed care:

- The pitch's `details.call.description` is the call **after** the review. Using it would leak the answer, so the original call comes from who challenged (the batting side challenges strikes, the fielding side challenges balls).
- The `count` on a pitch is the count **after** that pitch. The count before it comes from the previous pitch.

> **A gap I found later.** While re-collecting a full season for another article, I found that when the final call ends the plate appearance (a called strike three or ball four), `reviewDetails` sits on the **play**, not on the pitch. This study read only the pitch, so of the 3,543 challenges from August 1 to September 27 collected again, 893 (25%) were missing (the 2,650 it did capture differ slightly from the original 2,678 because they were collected at different times). The missing ones were overturned 48.6% of the time, against 56.8% for the captured ones.
>
> All 250 challenges put to Jev came from the captured part, so this section describes challenges where the plate appearance went on. Refitting the distance-only formula on all of August and scoring all of September (1,650) gives a Brier score of 0.102. On the captured September challenges (1,238), the original formula scores 0.1121 and the refitted one 0.1123, nearly the same. The two sets differ, so 0.102 and 0.112 cannot be compared directly, but using every challenge did not make the formula worse. I did not ask Jev again (the free allowance is spent), so Jev's numbers cover only the captured part.

The distance to the zone depends on whether the ball's surface touches the zone, so it is "distance from the zone rectangle to the ball's center, minus the ball's radius" (which gives the zone rounded corners):

```python
def edge_in(px, pz, top, bot):
    """Inches from the ball's surface to the zone; + misses, - touches."""
    x0, x1 = -17 / 24, 17 / 24                     # half the plate width (feet)
    dx = max(x0 - px, 0.0, px - x1)
    dz = max(bot - pz, 0.0, pz - top)
    if dx > 0 or dz > 0:
        d0 = math.hypot(dx, dz)
    else:
        d0 = -min(px - x0, x1 - px, pz - bot, top - pz)
    return (d0 - 1.45 / 12) * 12                    # minus the 1.45-inch ball radius
```

I asked Jev about 250 challenges from September and compared it with a logistic regression on a single input, "inches on the wrong side of the original call", fitted on 1,431 August challenges. Jev was given the coordinates and zone top and bottom, plus this distance precomputed.

### Result: the distance-only formula wins easily

The Brier score (mean squared gap between the probability and the 0/1 outcome; lower is better) was **0.113 for the distance-only formula and 0.180 for Jev**.

![On clear-cut pitches, only Jev stays hesitant](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_1b_bands.png)

I split the 250 into four groups by how far, and on which side, each pitch was from the original call. The 82 pitches at least an inch on the wrong side were overturned 99% of the time, and the formula said 98%. Jev's average probability was 65%. The 63 pitches more than an inch on the called side were never overturned, yet Jev gave them 18% on average.

Near the edge (within an inch) both the formula and Jev are unsure. Even pitches within an inch on the called side were overturned 58% of the time: the edge computed from StatsAPI coordinates does not seem to reproduce the zone ABS actually uses right at the edge.

### The wrong task for this tool

This result could have been predicted before measuring anything. ABS compares a tracked position with a fixed zone, so the answer is set by a rule; it is not a judgment call.

So I switched to something **not settled by a rule, and genuinely uncertain**.

## Main study: how much will a hitter's wOBA move next season?

A hitter's next season is a mix of regression to the mean, luck, age, injuries and more. No rule settles it, but measures of the hitting itself (xwOBA, strikeout rate and so on) are available, so there is material to judge from.

### Data and comparison

- **Data:** season hitting lines from my own MLB dataset ([yasumorishima/mlb-stats on Hugging Face](https://huggingface.co/datasets/yasumorishima/mlb-stats)), built from Baseball Savant and MLB StatsAPI
- **Hitters:** 227 with at least 250 plate appearances in both 2025 and 2026. The 82 who had 250 in 2025 but not in 2026 are not included, so this is about hitters who kept playing
- **Given to Jev:** 2025 PA, wOBA, xwOBA, strikeout and walk rates, ISO, BABIP, batted-ball mix (ground ball, fly ball, pulled air ball) and sprint speed; age and position in four bands. **No name or team, and numbers rounded**
- **Question:** which of five bins the 2026 change in wOBA falls in (Score)

The bin edges split past year-to-year changes into fifths. The past pairs are the 1,620 consecutive seasons from 2016→2017 through 2024→2025 with 250+ PA in both (pairs touching the 60-game 2020 season excluded). The edges came out at −36, −14, +3 and +25 points (1 point = 0.001 of wOBA).

Forecasts were scored with the RPS (Ranked Probability Score): the mean squared gap between the cumulative forecast and the cumulative outcome, so predicting "small rise" is punished more when the answer is "big drop" than when it is "big rise". Lower is better.

```python
def rps(probs, b):          # probs: 5 bin probabilities, b: actual bin (0-4)
    cp, tot = 0.0, 0.0
    for k in range(4):
        cp += probs[k]
        tot += (cp - (1.0 if b <= k else 0.0)) ** 2
    return tot / 4
```

Three comparators:

- **Guessing:** 20% in every bin
- **Marcel-style rule:** pull toward the league mean by plate appearances and adjust a little for age, with no fitting. The forecast change is the center of a normal distribution whose width is the rule's error on the past pairs, turned into five bin probabilities
- **Models fitted on past examples:** ridge regression fitted on n of the 1,620 past pairs

```python
def marcel(u):
    lg = u["lg"]                                             # 2025 league wOBA
    proj = lg + u["pa"] / (u["pa"] + 600) * (u["woba"] - lg)
    age = u["age"]
    proj *= (1 + 0.006 * (29 - age)) if age < 29 else (1 - 0.003 * (age - 29))
    return proj - u["woba"]                                  # forecast change
```

A model fitted on all the data will beat Jev, so the question is **how many past examples a fitted model needs to catch up with Jev**. That number is a rough measure of how much baseball knowledge Jev brings with it, which matters most where data is scarce, such as new foreign players or rookies.

To avoid reading the results in whatever way suited me, I committed the design and "which result means what" to the repository before calling Jev ([PREREG.md](https://github.com/yasumorishima/jev-baseball/blob/master/study2-projection/PREREG.md)).

## Jev's gain over guessing is a third of the Marcel-style rule's

![Jev's gain over guessing is a third of the Marcel-style rule's](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_2_gain.png)

Guessing scores an RPS of 0.195. The chart shows how far each method gets below that.

Jev gets 0.015 below, better than guessing: the 95% interval of the difference over 10,000 resamples of hitters is [−0.029, −0.001] and excludes 0.

The Marcel-style rule gets 0.046 below, and Jev does not reach it (difference +0.031, 95% interval [+0.017, +0.044]). By the pre-registered reading, **Jev is worse than a textbook rule**.

## Jev is worth a model fitted on 20 to 50 past examples

![Jev is worth a model fitted on 20 to 50 past examples](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_3_curve.png)

I fitted ridge regressions on n of the 1,620 past pairs (n = 10, 20, 50, 100, 300) and scored them on the same 227 hitters. Which examples are drawn matters, so each n is an average over 200 draws.

On average, the model fitted on 20 examples is worse than Jev and the one on 50 is better. With no examples at all, Jev forecasts about as well as a model fitted on 20 to 50 examples.

With 20 examples, though, the result swings a lot with the draw (95% range 0.157 to 0.242), and Jev's 0.180 is inside it. And only 20 and 50 were measured; where the lines cross is not a measured value.

## Jev rarely expects big moves

From here on, the analysis was done after seeing the results. First, where did Jev lose points?

![Jev rarely expects big moves](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_4_spread.png)

For each bin, the share of hitters who actually landed in it (gray) next to Jev's average probability for it (orange). The bins split past changes into fifths, so in past pairs each holds about 20%.

In 2026, 15% of the 227 had a big drop and 22% a big rise. Jev gave these 2% and 9%. It put too much on "about the same" and "small rise".

It is clearer hitter by hitter. I turned Jev's five probabilities into an "expected change" by weighting each bin's average change in the past pairs (−57, −24, −5, +14, +45 points).

![Jev's forecasts move only about 60% as much as the rule's](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_5_scatter.png)

The actual change is on the x-axis and the forecast change on the y-axis. Points on the dashed line are exact. Jev's forecasts stay within about ±30 points, a flat band.

The standard deviation of the forecasts is 13 points for Jev and 21 for the rule, against 36 for the actual changes. Actual changes include luck, so even a good forecast moves less than reality; the fair comparison is with the rule, and Jev moves only about 60% as much.

Because this "expected change" is built from bin averages, it cannot go below −57 points even if Jev puts 100% on "big drop". The bottom-left corner of the chart is partly a limit of that construction.

The direction is right. The correlation of the forecast with the actual change is 0.57 for Jev and 0.62 for the rule, not far apart. The gap is in how far the forecasts move.

## Jev missed the stars' big drops, got the unlucky hitters right

![Jev missed the stars' big drops, got the unlucky hitters right](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_7_examples.png)

The number beside each name is the 2025 wOBA. Jev never saw names; to Jev, Judge was "wOBA .465 (rounded to 0.005), an outfielder aged 30 to 33".

Aaron Judge had a .463 wOBA in 2025 and dropped 91 points in 2026. The rule, reasoning that such a high number regresses, forecast a 75-point drop; Jev forecast 20. Cal Raleigh (.392) and George Springer (.408) look the same: about 90 points down, with Jev at 15 to 23. No forecast, the rule included, caught drops this large.

Jev did better on others. Henry Davis had a low .229 wOBA in 2025, 64 points below his xwOBA (.293), an unlucky year. He rose 34 points; Jev said +35, nearly exact, while the rule said +64, too high.

Michael Conforto rose 55; Jev said +34 and the rule +11, so Jev was closer. His wOBA was 43 points below his xwOBA, and here it matters whether a forecast uses luck (next section).

## Jev uses luck, but not much regression to the mean

What Jev leans on may explain these five. I regressed Jev's expected change on two inputs:

- **Regression to the mean:** how far the 2025 wOBA was above the league mean
- **Luck:** 2025 wOBA − xwOBA (the gap to the wOBA expected from exit velocity and launch angle)

and fitted the same regression to the actual changes in the 1,620 past pairs:

```python
X = np.c_[np.ones(n), woba_minus_league, woba_minus_xwoba]
w_actual, *_ = np.linalg.lstsq(X_train, actual_delta_train, rcond=None)   # 1,620 past pairs
w_jev, *_    = np.linalg.lstsq(X_test, jev_expected_delta, rcond=None)     # Jev's forecasts (227)
```

![Jev uses luck, but not much regression to the mean](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_6_weights.png)

In the past pairs, a hitter one point above the league mean gave back 0.43 points the next season, and one point of wOBA above xwOBA also gave back 0.43. In Jev's forecasts, the luck weight is 0.32, somewhat weaker than reality, but the regression weight is 0.20, less than half.

The Marcel-style rule is the reverse: a strong regression weight (0.57) but, with no xwOBA in the formula, almost no luck weight (0.01). That is why the rule said only +11 for Conforto; the past-pair weights give +30.

A star who really was hitting, like Judge, also has a high xwOBA, so there is little luck to give back. What is left is regression to the mean: −66 points with the past-pair weights, but Jev uses it weakly and stopped at −20 (the actual was −91, beyond even the weights' formula).

For Henry Davis, the past-pair weights give +64, the same as the rule. Jev being right on Davis is one hitter's result that these two inputs do not explain.

## Width and regression filled in: indistinguishable from the rule

If Jev's forecasts are too narrow, does widening them catch up with the rule? I did not ask Jev again; everything below is computed from its existing answers.

- **Jev's center + the rule's width:** a normal distribution centered on Jev's expected change, with the rule's width (the standard deviation of the rule's errors in past pairs, 32 points), turned into five bin probabilities
- **Flattening:** Jev's bin probabilities flattened as `p ** (1 / T)` and mixed with guessing (20% each) at weight w. T and w were chosen by splitting the 227 into 10 groups, picking the best on nine and scoring the tenth (every group chose T between 2.7 and 3.2 and w = 0)
- **... plus the missing regression to the mean:** the first repair, with (past-pair weight 0.43 − Jev's weight 0.20) × (points above the league mean) added to the center. Neither weight uses any 2026 outcome

![Width and regression filled in: indistinguishable from the rule](https://raw.githubusercontent.com/yasumorishima/jev-baseball/master/blog_ja/en_8_width.png)

Keeping Jev's center with the rule's width takes the RPS from 0.180 to 0.162, closing more than half of the 0.031 gap to the rule. Flattening gives 0.168. Neither reaches the rule's 0.149, and the 95% intervals of the differences exclude 0 (width only: +0.014 [+0.004, +0.023]).

Adding the missing regression to the mean gives 0.1505, a difference from the rule of +0.002 (95% interval [−0.005, +0.008]): indistinguishable. I think the remaining gap was almost all the weak regression to the mean. This repair, though, was thought of after seeing the results, and the repaired forecast is no longer Jev's alone.

## Summary

In this data:

- On a problem settled by a rule, like ABS challenges, Jev lost clearly to a distance-only formula (Brier 0.113 vs 0.180)
- Asked for next season's wOBA change from anonymized lines, Jev beat guessing and was worth a model fitted on 20 to 50 past examples, but it did not reach the Marcel-style rule
- It gets the direction, and it uses luck (wOBA − xwOBA), a little less than it should
- It underestimates how far hitters move, above all by using too little regression to the mean. Repairing the width and the regression after the fact gave a forecast indistinguishable from the rule (no longer Jev's alone)

What the two studies share: **Jev gets the direction, but its probabilities sit too close to the middle**. Personally, if I start from Jev's answers where data is scarce, the next thing I want to try is filling in regression to the mean and the width from a small amount of data.

I tested one model version (`jev-1.13-20260917`), one way of asking, and MLB hitters from 2025 to 2026 only. Other prompts or other tasks may give different results.

## Appendix

**Terms**

- wOBA: an on-base measure weighting each outcome (walk, single, home run and so on) by its run value; the 2025 league mean was .313
- xwOBA: wOBA with each batted ball replaced by the value expected from its exit velocity and launch angle
- RPS: score for ordered-bin forecasts; mean squared gap between cumulative forecast and cumulative outcome; lower is better
- Brier score: score for yes/no probabilities; mean squared gap between probability and the 0/1 outcome; lower is better

**Pre-registered vs post-hoc**

- Pre-registered: how hitters were selected, the bins, the comparators, the learning curve (models fitted on n examples) and the main readings
- The registered readings included a rule like "if the catch-up point is 50 examples, then ...", but the "worse than the Marcel-style rule" rule applied first, so the catch-up point is reported descriptively
- Post-hoc: the bin shares, the scatter, the named hitters, the regression weights, the width and regression repairs, and the ABS breakdown by distance

**Caveats**

- Without 17 near-outlier lines (any input more than 2.5 standard deviations from the mean), the difference from guessing has an interval crossing 0 ([−0.024, +0.005])
- Rounding does not hide stars like Judge, so Jev may have recognized players. I also blended each line with a similar hitter's to hide identity, but blending narrows the actual changes too (standard deviation 0.036 → 0.029), which favors Jev's narrow forecasts. Recall would make Jev worse on blended lines and the narrowing makes it better, and only the sum is observed, so **this check cannot say whether Jev recalls players**
- "Jev's expected change" is computed from its bin probabilities and the past bin averages; Jev did not state it
- The weight comparison uses different samples (Jev's 227 forecasts vs 1,620 past actual changes). Fitting the 227 hitters' actual 2026 changes gives 0.52 for regression and 0.41 for luck, the same pattern
- The ABS comparison uses a zone computed from StatsAPI coordinates, which does not reproduce the ABS zone exactly at the edge

**Data and code**

- Hitting: [yasumorishima/mlb-stats (Hugging Face)](https://huggingface.co/datasets/yasumorishima/mlb-stats), taken on 2026-09-29, two days after the regular season ended
- ABS challenges: MLB StatsAPI game feeds
- Analysis and charts: https://github.com/yasumorishima/jev-baseball (post-hoc analysis in `study2-projection/deepdive.py`)
- Japanese version: [Qiita](https://qiita.com/ussu_ussu_ussu/items/cc28f711396515c1fb31)
