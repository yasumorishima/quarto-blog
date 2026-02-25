---
title: "3D Skeleton Detection from Baseball Motion Capture Data with Driveline C3D"
published: true
description: "I analyzed pitching and hitting biomechanics using Driveline OpenBiomechanics C3D data, ezc3d, and MediaPipe. Trunk rotation range showed the strongest correlation with pitch velocity (r=0.425)."
tags: python, baseball, datascience, computervision
canonical_url: https://zenn.dev/shogaku/articles/baseball-cv-skeleton-biomechanics
cover_image:
---

> **License**: Motion capture data from [Driveline OpenBiomechanics Project](https://www.openbiomechanics.org/) under **CC BY-NC-SA 4.0**.
> **Citation**: Wasserberger KW, Brady AC, Besky DM, Jones BR, Boddy KJ. *The OpenBiomechanics Project: The open source initiative for anonymized, elite-level athletic motion capture data.* (2022).
> License: https://creativecommons.org/licenses/by-nc-sa/4.0/
> Derivative works (graphs, GIFs) in this article follow the same license.

## What I Built

I visualized baseball pitching and hitting in 3D, extracted joint kinematics, and explored the relationship between body mechanics and pitch velocity.

Tools used:
- **Driveline OpenBiomechanics Project (OBP)** — elite-level motion capture C3D data (100 pitchers + 98 hitters)
- **ezc3d** — C3D file I/O library ([GitHub](https://github.com/pyomeca/ezc3d), MIT License)
- **matplotlib** — 3D visualization and animation

→ **GitHub**: https://github.com/yasumorishima/baseball-cv

### My Connection to ezc3d

I contributed a bug fix to ezc3d via [PR #384](https://github.com/pyomeca/ezc3d/pull/384). Using a library I contributed to for this analysis felt like a natural progression.

---

## Step 1: 3D Skeleton Visualization from C3D

C3D files contain 3D coordinates of body markers captured by motion capture systems.

- **Pitching**: 45 markers, 360Hz, ~726 frames
- **Hitting**: 55 markers (45 body + 10 bat), 360Hz, ~804 frames

```python
import ezc3d

c3d = ezc3d.c3d("pitching_sample.c3d")
points = c3d["data"]["points"]  # shape: (4, n_markers, n_frames)
labels = c3d["parameters"]["POINT"]["LABELS"]["value"]
```

### Pitching Skeleton Animation

![Pitching skeleton animation](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/skeleton_pitching_anim.gif)

45 markers connected as a skeleton. The full wind-up to release motion is visible.

### Hitting Skeleton Animation

![Hitting skeleton animation](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/skeleton_hitting_anim.gif)

55 markers with bat markers shown in red.

---

## Step 2: Video-Based Skeleton Detection with MediaPipe

Beyond C3D data, Google's MediaPipe Pose can detect 33 body landmarks from regular video.

```python
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
```

The advantage: no motion capture equipment needed — a smartphone video is enough.

---

## Step 3: Joint Angle & Angular Velocity Extraction

From the skeleton coordinates, I computed joint angles as time series.

### Pitching Results

| Joint Angle | Min | Max |
|---|---|---|
| Elbow Flexion | 50.5° | 156.7° |
| Shoulder Abduction | 4.6° | 117.7° |
| Trunk Rotation | 0° | 58° |
| Knee Flexion | 99.1° | 163.8° |

### Angular Velocity Time Series

![Joint angular velocity time series](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/kinematic_sequence_pitching.png)

This plot shows angular velocity (degrees/sec) per frame, revealing which joints move fastest at each phase of the pitching motion.

---

## Step 4: Skeleton Features × Pitch Velocity Correlation

Driveline OBP C3D filenames encode pitch velocity (e.g., `..._809.c3d` → 80.9 mph).

I analyzed 16 pitchers to find correlations between skeleton-derived features and velocity.

### Correlation Results

![Scatter plot](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/scatter_pitching.png)

![Correlation matrix](https://raw.githubusercontent.com/yasumorishima/baseball-cv/master/data/output/correlation_pitching.png)

| Feature | r | p-value |
|---|---|---|
| Peak Trunk Angular Velocity | 0.119 | 0.673 |
| Peak Elbow Angular Velocity | 0.094 | 0.739 |
| Peak Shoulder Abduction | 0.180 | 0.520 |
| **Trunk Rotation Range** | **0.425** | **0.114** |

With only 16 samples, none reached statistical significance. However, **trunk rotation range of motion showed the strongest positive correlation** (r=0.425) with pitch velocity.

This suggests that "how far a pitcher can rotate their trunk" may contribute to velocity. A larger sample size would likely clarify the relationship.

---

## Summary

- Visualized 3D pitching and hitting skeletons from Driveline OBP C3D data using ezc3d
- Extracted joint angle and angular velocity time series
- Trunk rotation range showed the strongest correlation with pitch velocity (r=0.425)
- MediaPipe enables skeleton detection without motion capture equipment

→ **GitHub**: https://github.com/yasumorishima/baseball-cv

**Data**: [Driveline OpenBiomechanics Project](https://www.openbiomechanics.org/) (CC BY-NC-SA 4.0)
**ezc3d**: [pyomeca/ezc3d](https://github.com/pyomeca/ezc3d) (MIT License)
