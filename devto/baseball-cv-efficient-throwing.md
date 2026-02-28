---
title: "Why Two Pitchers with the Same Arm Speed Differ by 10 mph — A Motion Capture Analysis"
published: true
description: "I analyzed 61 pro pitchers using Driveline OpenBiomechanics C3D data and found 5 body mechanics factors that explain a 10+ mph gap in pitch speed among pitchers with identical arm speed."
tags: python, baseball, datascience, biomechanics
canonical_url: https://zenn.dev/shogaku/articles/baseball-cv-efficient-throwing
cover_image:
---

> **License**: Motion capture data from [Driveline OpenBiomechanics Project](https://www.openbiomechanics.org/) under **CC BY-NC-SA 4.0** (non-commercial, share-alike).
> **Citation**: Wasserberger KW, Brady AC, Besky DM, Jones BR, Boddy KJ. *The OpenBiomechanics Project: The open source initiative for anonymized, elite-level athletic motion capture data.* (2022).
> License: https://creativecommons.org/licenses/by-nc-sa/4.0/
> Derivative works (graphs, GIFs) in this article follow the same license. Commercial use by professional sports organization employees is restricted.

## The Finding

**Pitchers with nearly identical arm speed (24–26 m/s) can differ by up to 13 mph in pitch velocity.**

Arm strength alone doesn't explain this gap. So what does?

I analyzed 61 pro pitchers using Driveline OpenBiomechanics C3D motion capture data and found **5 body mechanics factors** that explain the difference.

→ **GitHub**: https://github.com/yasumorishima/baseball-cv

---

## The Data

**Driveline OpenBiomechanics Project (OBP)**

- 61 pitchers, C3D motion capture files
- 45 markers (shoulder, elbow, wrist, pelvis, knee, heel, etc.)
- 360 Hz sampling rate
- Pitch speed range: 71.3–93.1 mph

I used [ezc3d](https://github.com/pyomeca/ezc3d) to read the C3D files (I contributed a bug fix to this library, which is what started this project).

---

## Defining "Body Efficiency"

Arm speed and pitch velocity are strongly correlated (r=0.67). That's expected.

The key insight: compute the **residual** after regressing pitch speed on arm speed:

```python
lm = LinearRegression().fit(df[['peak_wrist_linear_speed']], df['pitch_speed_mph'])
df['body_efficiency'] = df['pitch_speed_mph'] - lm.predict(df[['peak_wrist_linear_speed']])
```

Positive = "throws faster than arm speed predicts" → efficient body use
Negative = "arm is fast but doesn't translate" → arm-reliant

I split pitchers into quintiles Q1 (least efficient) through Q5 (most efficient).

---

## Graph 1: The Big Picture

![Body efficiency overview](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/efficient_throwing_story.png)

Three panels:

**Left (scatter)**: Arm speed (x) vs pitch velocity (y). Notice vertical spread — same arm speed, very different outcomes.

**Center (R² steps)**: Each bar shows how much predictive power is added by each factor. Taller = more explained.

**Right (Q1 vs Q5)**: Each bar shows how far each group deviates from the overall average (positive = favorable direction for pitch speed, negative = unfavorable).

---

## The 5 Factors

| Factor | R² | Physical meaning |
|---|---|---|
| Arm speed + Height | 0.473 | Baseline |
| + Stride (translation) | 0.477 | How far the lead foot travels |
| + Leg lift (elastic) | 0.522 | Knee height before stride |
| + Arm chain (whip) | 0.562 | Whether the body drives the elbow |
| + **Knee smoothness** | **0.648** | Smoothness of lead leg trajectory |

**R²=0.648** means these 5 factors explain ~65% of pitch speed variance. Arm speed alone explained ~47% — an 18-point improvement.

### What each factor means

**Stride**: How far the lead foot advances before landing. Longer stride = more translational energy transferred to the arm.

**Leg lift**: Knee height during windup. Higher knee = more elastic energy stored in the hip, released during the stride.

**Arm chain (whip)**: Ratio of elbow speed to wrist speed. Lower = body is pulling the elbow (body-driven). Higher = arm working independently.

**Knee smoothness**: How smoothly the lead knee moves through its 3D trajectory. Measured by the irregularity of the knee's path — lower = smoother, more controlled movement.

---

## Why Does Knee Smoothness Matter?

This is the most counterintuitive finding:

- **Looking at all pitchers**: r=+0.12 (faster pitchers move their whole body more intensely, so knee irregularity tends to be higher too)
- **After controlling for arm speed**: r=−0.45*** (among pitchers with the same arm speed, smoother knees = faster pitches)

The effect only appears after removing arm speed's influence — meaning the raw data masks the true relationship. Once you account for arm speed, smoother knees consistently predict faster pitches.

Proposed mechanism: **smooth knee → more efficient pelvis rotation → higher pelvis/arm speed ratio (+17%) → the body "whips" the arm through the kinematic chain**

---

## Graph 2: Q1 vs Q5 Head-to-Head

![Q1 vs Q5 comparison](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/body_efficiency_breakdown.png)

| Metric | Q1 (inefficient) | Q5 (efficient) |
|---|---|---|
| Arm speed | 24.73 m/s | 24.69 m/s |
| **Pitch speed** | **79.1 mph** | **89.3 mph** |
| **Gap** | — | **+10.2 mph** |

Arm speed difference: 0.04 m/s. Pitch speed difference: 10.2 mph (~16 km/h).

---

## Skeleton GIF: Same Arm Speed, 10 mph Apart

![Q1 vs Q5 skeleton comparison](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/efficient_thrower_comparison.gif)

**Left (Q1)**: Arm 26.56 m/s → **80.8 mph** (stride 0.30m)
**Right (Q5)**: Arm 24.96 m/s → **91.8 mph** (stride 0.89m)

Red = lead leg. Orange star = foot landing position. Both are synchronized at foot strike.

The difference in stride length is immediately visible. Q5 drives the entire body forward while Q1 stays more upright.

---

## Root Cause: Why Is Q1's Stride Short?

I traced the cause to **ankle braking** — how much the lead foot decelerates on landing.

- Q1: ankle braking ≈ 0.06 m/s² (nearly none)
- Q5: ankle braking ≈ 3.58 m/s² (strong brake)

ankle_braking → stride correlation: **r=+0.55***

Lead knee lift also differed:
- Q1: max knee flexion 85.4° (shallow lift)
- Q5: max knee flexion 76.0° (deep lift)

The causal chain:

```
Shallow knee lift → short stride
Weak ankle brake → short stride
                ↓
        Less body translation
                ↓
        Weaker kinematic chain → lower pitch speed
```

---

## Summary

- Among pitchers with the same arm speed, pitch velocity can vary by 13 mph
- A "body efficiency" residual metric exposes this gap
- 5 body mechanics factors explain 64.8% of pitch speed variance (R²=0.648)
- Knee smoothness contributes most (+0.087 R²); its effect only becomes visible after controlling for arm speed
- Root cause: ankle braking and knee lift → stride → kinematic chain

The data suggests that "how the body is sequenced" matters as much as raw arm speed — consistent with established biomechanics literature on the kinematic chain.

→ **GitHub**: https://github.com/yasumorishima/baseball-cv

**Data**: [Driveline OpenBiomechanics Project](https://www.openbiomechanics.org/) (CC BY-NC-SA 4.0, non-commercial)
**ezc3d**: [pyomeca/ezc3d](https://github.com/pyomeca/ezc3d) (MIT License)
