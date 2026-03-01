---
title: "Does Exit Velocity Come from the Front Foot? Exploring Driveline Motion Capture Data"
published: true
description: "I analyzed 40 hitters using Driveline OpenBiomechanics C3D data and found that front leg mechanics — not bat speed — may be the key differentiator in exit velocity. An exploratory analysis (n=40)."
tags: python, baseball, datascience, biomechanics
canonical_url: https://zenn.dev/shogaku/articles/baseball-cv-hitting-frontleg
cover_image:
---

> **License**: Motion capture data from [Driveline OpenBiomechanics Project](https://www.openbiomechanics.org/) under **CC BY-NC-SA 4.0** (non-commercial, share-alike).
> **Citation**: Wasserberger KW, Brady AC, Besky DM, Jones BR, Boddy KJ. *The OpenBiomechanics Project: The open source initiative for anonymized, elite-level athletic motion capture data.* (2022).
> Derivative works (graphs, GIFs) in this article follow the same license. Commercial use by professional sports organization employees is restricted.

> **Note**: This is an exploratory analysis with n=40. I use "suggests" and "trend" rather than definitive claims.

## The Question

Two hitters. Almost the same bat speed. But one hits the ball 20 mph harder. Why?

I tried to answer this using 40 hitters' worth of professional-grade motion capture data from [Driveline OpenBiomechanics Project](https://www.openbiomechanics.org/).

The short answer: **bat speed alone explained almost nothing. Front leg mechanics did.**

→ **GitHub**: https://github.com/yasumorishima/baseball-cv

---

## The Data

**Driveline OpenBiomechanics Project (OBP)**

- 40 hitters, C3D motion capture format
- 45 body markers (shoulder, elbow, wrist, hip, knee, heel, etc.)
- 360 Hz sampling rate
- Exit velocity range: ~70–110 mph

C3D is a binary format for storing 3D motion capture data. I used [ezc3d](https://github.com/pyomeca/ezc3d) to parse it in Python.

This is the **hitting counterpart** of my [pitching analysis](https://dev.to/shogaku/why-two-pitchers-with-the-same-arm-speed-differ-by-10-mph-a-motion-capture-analysis-4mf3) — same dataset, same method, applied to batters.

---

## Bat Speed Barely Predicts Exit Velocity

The first surprise: wrist speed (a proxy for bat speed) explained only **9.7%** of exit velocity variance in this dataset.

```
bat speed only         → R² = 0.097
+ height/weight        → R² = 0.183
+ stride length        → R² = 0.494  ← jump of +0.311
```

Adding **stride length** (how far the hitter steps forward) nearly tripled the model's explanatory power.

This doesn't mean bat speed doesn't matter — it clearly does — but **among hitters with similar bat speed, body mechanics appear to matter more**.

---

## Defining a "Body Efficiency Score"

Same approach as my pitching analysis: calculate the residual after controlling for bat speed and body size.

```python
lm = LinearRegression().fit(
    df[['peak_wrist_linear_speed', 'height_in', 'weight_lb']],
    df['exit_velocity_mph']
)
df['body_efficiency'] = df['exit_velocity_mph'] - lm.predict(...)
```

Positive = hits harder than expected given bat speed (efficient body use)
Negative = bat speed is there but exit velocity isn't (arm-dependent)

I split the 40 hitters into quintiles (Q1 = least efficient, Q5 = most efficient).

---

## Q1 vs Q5: Slower Bat Speed, 20 mph More Exit Velocity

| | Q1 (inefficient) | Q5 (efficient) |
|---|---|---|
| Bat speed (wrist) | **9.42 m/s** | 9.04 m/s |
| **Exit velocity** | 79.8 mph | **98.4 mph** |
| **Difference** | — | **+18.6 mph** |

Q5 hitters have *lower* bat speed but hit the ball nearly 20 mph harder. Something in their body mechanics is doing the work.

---

## Overview Charts

![Hitting efficiency overview](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/efficient_hitting_story.png)

![Q1 vs Q5 comparison](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/body_efficiency_hitting_breakdown.png)

---

## The Front Leg Wall

### Correlation with exit velocity (n=27 after dropping NA)

| Feature | r | Significance |
|---|---|---|
| Stride length | **+0.548** | p<0.01 |
| Hip-ankle gap (how far hip drifts past ankle) | **−0.459** | p<0.05 |

The two strongest predictors: **stride long, hip doesn't drift forward**.

### The physical mechanism (hypothesis)

```
Stride creates forward momentum (linear energy)
        ↓
Front foot plants — ankle becomes a fixed pivot
        ↓
Hip stops moving forward (hip-ankle gap stabilizes)
        ↓
Linear → rotational energy conversion
        ↓
Bat accelerates → higher exit velocity
```

This is the "lead leg block" (LLB) concept in baseball coaching — when the front foot plants, it creates a wall that converts forward momentum into rotation.

### Visualizing the wall

![Wall GIF](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/llb_wall_hitting.gif)

Top: 3D skeleton animation (red = lead leg)
Bottom: hip-to-ankle gap over time in the forward direction

**Q5 (blue)**: after foot strike, the gap stabilizes — the wall is working
**Q1 (orange)**: after foot strike, the hip keeps drifting forward — no wall

---

## When the Knee Stops

Digging deeper, the most striking difference is **when the front knee stops moving forward after foot strike**.

### Front knee forward velocity (foot strike = 0 ms)

| Time | Q1 | Q5 |
|---|---|---|
| 0 ms (foot strike) | +0.628 m/s | +0.584 m/s |
| 25 ms | +0.349 m/s | +0.389 m/s |
| **50 ms** | **+0.203 m/s** | **−0.019 m/s (stopped!)** |
| 100 ms | −0.212 m/s | −0.623 m/s |
| 150 ms | −0.358 m/s | −0.807 m/s |

Q5's knee **stops completely at 50 ms** and then rapidly extends. Q1's knee keeps moving forward.

### Brace quality

![Brace quality chart](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/llb_brace_hitting.png)

| Metric | Q1 | Q5 | Difference |
|---|---|---|---|
| Time to peak extension | 0.185 s | **0.107 s** | **78 ms faster** |
| Peak extension velocity | 355 deg/s | **468 deg/s** | **+32%** |
| Knee forward decel | 0.425 m/s² | **0.602 m/s²** | +42% |

Q5 hitters "stop fast and extend fast" — the knee locks into a stable axis quickly, and then the hip can rotate around it efficiently.

### Knee angle animation

![Knee detail GIF](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/llb_knee_detail_hitting.gif)

Solid line = knee angle, dashed = extension velocity, dot = current frame.

---

## Skeleton GIF: Same Bat Speed, 20 mph Gap

![Q1 vs Q5 skeleton](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/efficient_hitter_comparison.gif)

**Left (Q1)**: bat speed 9.42 m/s → exit velocity **74.6 mph** (stride 0.72 m)
**Right (Q5)**: bat speed 7.80 m/s → exit velocity **97.2 mph** (stride 0.99 m)

Red = lead leg. The Q5 hitter takes a longer stride and the front leg brakes sharply after landing.

---

## Full Mechanism Summary

```
Long stride → forward momentum (stride r=+0.548)
        ↓
Knee stops at ~50 ms post foot strike
        ↓
Hip doesn't drift forward (hip-ankle offset r=−0.459)
        ↓
Linear → rotational energy conversion (pivot)
        ↓
Rapid knee extension (468 vs 355 deg/s, +32%)
        ↓
Bat accelerates → +18.6 mph exit velocity
```

---

## Limitations

- **n=40** is small. One facility (Driveline), one population (amateur to minor league)
- Correlation ≠ causation. "Better front leg = more exit velocity" is not established
- Wrist speed ≠ true bat head speed
- Representativeness to MLB/NPB is unknown

This is exploratory. The patterns are interesting but shouldn't be over-interpreted.

---

## Summary

- Bat speed (wrist speed) alone explains only ~10% of exit velocity variance in this dataset
- Adding stride length jumps explanatory power to ~50%
- Q5 hitters' front knee stops within 50 ms of foot strike; Q1's keeps drifting forward
- "Lead leg block" — stride creates momentum, rapid knee extension converts it to rotation — may be a key differentiator

The data suggests there's a consistent front-leg pattern among efficient hitters. Whether training to replicate it actually improves exit velocity is a different question.

→ **GitHub**: https://github.com/yasumorishima/baseball-cv

**Data**: [Driveline OpenBiomechanics Project](https://www.openbiomechanics.org/) (CC BY-NC-SA 4.0, non-commercial)
**ezc3d**: [pyomeca/ezc3d](https://github.com/pyomeca/ezc3d) (MIT License)
