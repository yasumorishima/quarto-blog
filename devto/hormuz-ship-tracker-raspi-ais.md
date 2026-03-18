---
title: "Monitoring the Strait of Hormuz Blockade with Open AIS Data and a Raspberry Pi"
published: true
description: Building a real-time maritime monitoring system that quantifies the impact of the 2026 Hormuz crisis using free AIS data, Python, and a Raspberry Pi 5.
tags: python, raspberrypi, docker, maritime
canonical_url: https://zenn.dev/shogaku/articles/hormuz-ship-tracker-raspi-ais
---

> **Data scope disclaimer**: All data in this article comes from [aisstream.io](https://aisstream.io/)'s **terrestrial AIS receivers**. Coverage in open water (mid-strait) is limited; satellite AIS would provide a more complete picture. All figures are from **mid-March 2026** and the situation is evolving daily.

## What This Is

In March 2026, shipping through the Strait of Hormuz — through which roughly 20% of the world's oil passes — was reported to be severely restricted. I built a monitoring system to observe this using free AIS (Automatic Identification System) data and a Raspberry Pi 5.

This post covers the system architecture, the analytics pipeline, and what the data shows within the limitations of terrestrial AIS coverage.

**Repository**: [yasumorishima/hormuz-ship-tracker](https://github.com/yasumorishima/hormuz-ship-tracker)

![Persian Gulf vessel distribution (mid-March 2026) — traffic concentrated around UAE coast, strait center nearly empty](https://raw.githubusercontent.com/yasumorishima/hormuz-ship-tracker/7188e89/docs/snapshot_latest.png)
*Auto-generated snapshot (every 6 hours). Shows gate line positions, transit IN/OUT stats, and vessel type distribution. Note the concentration around UAE ports and the near-empty strait center.*

## AIS Data

AIS is a maritime safety system where vessels automatically broadcast their position, speed, course, name, and type over VHF radio. It's mandatory for international vessels over 300 gross tonnage.

[aisstream.io](https://aisstream.io/) aggregates terrestrial AIS receiver data worldwide and streams it via a free WebSocket API. This is the data source for this project.

## Architecture

```
aisstream.io (WebSocket)
  → Collector (AIS receiver + land filter + SQLite)
  → Analytics Engine (gate-line transit detection + vessel classification)
  → FastAPI + Leaflet.js + Chart.js (dashboard)
  → matplotlib (6-hourly snapshot → GitHub auto-push)
```

Two Docker containers run 24/7 on a Raspberry Pi 5: the main collector/API and a snapshot cron job.

## What the Data Shows

### 67% Anchored Ratio (mid-March 2026)

Of ~290 monitored vessels, about 67% were stationary (speed < 0.5 knots). In a typical port area, this ratio is usually around 30–40%. The elevated value is notable.

### 35 Vessels Waiting 6+ Hours (mid-March 2026)

Vessels that haven't moved for over 6 hours are counted as the "waiting fleet." About 35 vessels met this criterion, with 11 stuck for over 24 hours.

Waiting fleet flags (estimated from MMSI MID):

| Flag | Count |
|---|---|
| Panama | 9 |
| Marshall Islands | 3 |
| UAE | 3 |
| Kuwait | 2 |
| Others | 1 each |

Panama and Marshall Islands are open registries — commonly used by large commercial ships and tankers. Seven tankers were among the waiting fleet.

### Near-Zero Strait Transits on Terrestrial AIS (mid-March 2026)

A virtual gate line across the narrowest point of the Strait of Hormuz detects vessel crossings automatically. Only 1 transit was detected in 24 hours.

**Important caveat**: this only reflects what aisstream.io's **terrestrial AIS receivers** can capture. Coverage in mid-strait open water is limited. News reports indicate some vessels (Turkish, Indian, Saudi-flagged) have been allowed limited passage — these may not appear in terrestrial AIS data. **"No data" does not equal "no ships."** This caveat applies to all figures in this article.

### Traffic Concentrated Around UAE Coast (mid-March 2026)

Most data clusters around Dubai, Jebel Ali, and Fujairah. Three gate lines capture port approach traffic:

| Gate | Inbound | Outbound |
|---|---|---|
| Dubai / Jebel Ali Approach | 20 | 9 |
| Fujairah Approach | 0 | 7 |
| Strait of Hormuz | 0 | 1 |

Dubai inbound significantly exceeds outbound. Fujairah shows only outbound traffic — likely vessels departing after bunkering (refueling).

## Technical Implementation

### Gate-Line Transit Detection

Virtual gate lines (line segments) are defined at the strait and port approaches. For each vessel, consecutive position reports are checked for intersection with each gate using computational geometry:

```python
def segments_intersect(p1, p2, p3, p4):
    d1 = cross_product(p3, p4, p1)
    d2 = cross_product(p3, p4, p2)
    d3 = cross_product(p1, p2, p3)
    d4 = cross_product(p1, p2, p4)
    if ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and \
       ((d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0)):
        return True
    return False
```

Direction (INBOUND/OUTBOUND) is determined by the sign of the cross product relative to the gate vector. Same-vessel crossings within 6 hours are deduplicated.

### Data-Driven Situation Assessment

All dashboard text is auto-generated from data patterns. The system classifies the situation level based on strait transits, anchored ratio, and waiting fleet size:

```python
if strait_transits == 0 and anchored_pct > 40:
    return {"level": "critical", "title": "Strait Transit Suspended"}
elif 0 < strait_transits <= 5:
    return {"level": "elevated", "title": "Limited Strait Transit"}
else:
    return {"level": "normal", "title": "Monitoring Active"}
```

When conditions normalize, the UI automatically shifts to normal mode — no hardcoded crisis messaging.

### MMSI → Flag Mapping

Since aisstream.io's metadata doesn't reliably include country codes, flags are derived from the first 3 digits of the 9-digit MMSI number (Maritime Identification Digits). The system maps 100+ MIDs to countries.

### Destination Normalization

AIS destination fields are free-text and wildly inconsistent (DUBAI, AE DXB, AEDXB, DMC DUBAI, etc.). Over 40 variants are mapped to canonical port names.

## 4-Day Data Analysis Update (March 18)

After 4 days of continuous collection (43,000+ position records, 384 unique vessels), several new insights emerged.

### Traffic Density Heatmap

![Traffic Density Heatmap](https://raw.githubusercontent.com/yasumorishima/hormuz-ship-tracker/master/docs/heatmap.png)

*Left: Full Gulf hexbin density. Right: Zoomed strait with AIS dead zone. Bottom: Port area, flag state, and vessel type breakdowns.*

| Metric | Value |
|---|---|
| Clean positions | 36,000 |
| Anomalous (filtered) | 7,300 (17%) |
| Unique vessels | 384 |
| Strait crossings confirmed | 0 |
| Dubai / Jebel Ali gate crossings | 61 |

### Timelapse — 24 Hours of Vessel Movement

![Vessel Movement Timelapse](https://raw.githubusercontent.com/yasumorishima/hormuz-ship-tracker/master/docs/timelapse.gif)

*24-hour vessel movement animation. Positions are linearly interpolated between data points, with land-crossing prevention.*

### AIS Data Quality: What the Anomalies Actually Are

About 17% of positions contained anomalous data. Two distinct patterns were identified:

| Anomaly | Count | Cause |
|---|---|---|
| Speed = 102.3 kn | ~3,200 | AIS protocol "not available" sentinel (10-bit 0x3FF) |
| Speed 40–99 kn | ~4,100 | Coastal receiver decode errors |

The ~48 kn cluster was particularly interesting: on 2026-03-16 at 07:00 UTC, 4 vessels simultaneously appeared at the same coordinates in the strait with identical speeds. This was a single receiver malfunction — no ships were actually there. These anomalies had produced 41 false transit detections, which were eliminated by filtering positions with speed >= 40 kn.

The dashboard now shows anomalous vessels with red dashed markers and a "DATA QUALITY WARNING" popup.

### Browser-Based Replay

The `/replay` endpoint provides a Leaflet.js animated replay with play/pause, speed control (0.25x–16x), timeline scrubbing, and keyboard shortcuts.

## Limitations

- **Terrestrial AIS coverage**: Free aisstream.io data comes from shore-based receivers. Open-water coverage (mid-strait) is limited
- **AIS speed 102.3 knots**: The "not available" sentinel value (0x3FF). Must be filtered
- **Speed 40–99 kn receiver glitches**: Coastal receiver decode errors produce phantom positions. Transit detection filters speed >= 40 kn
- **Collection period**: Ongoing collection. Longer-term trend analysis requires further accumulation

## Summary

Using aisstream.io's free API and a Raspberry Pi 5, this system continuously collects and analyzes vessel traffic across the entire Persian Gulf. After 4 days, 43,000+ positions have been collected, with heatmap visualization, timelapse animation, and data quality analysis fully implemented.

Statistics are auto-updated every 6 hours.

**[Live Statistics (auto-updated)](https://github.com/yasumorishima/hormuz-ship-tracker/blob/master/docs/STATS.md)** / **[Repository](https://github.com/yasumorishima/hormuz-ship-tracker)**

Data source: [aisstream.io](https://aisstream.io/) / Land polygons: [Natural Earth](https://www.naturalearthdata.com/)
