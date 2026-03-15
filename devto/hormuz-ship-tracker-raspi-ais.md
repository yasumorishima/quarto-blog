---
title: "Monitoring the Strait of Hormuz Blockade with Open AIS Data and a Raspberry Pi"
published: true
description: Building a real-time maritime monitoring system that quantifies the impact of the 2026 Hormuz crisis using free AIS data, Python, and a Raspberry Pi 5.
tags: python, raspberrypi, docker, maritime
canonical_url: https://zenn.dev/shogaku/articles/hormuz-ship-tracker-raspi-ais
---

## What This Is

In March 2026, shipping through the Strait of Hormuz — through which roughly 20% of the world's oil passes — came to a near-complete halt. I built a monitoring system to observe this in real time using free AIS (Automatic Identification System) data and a Raspberry Pi 5.

This post covers the system architecture, the analytics pipeline, and what the data actually shows.

**Repository**: [yasumorishima/hormuz-ship-tracker](https://github.com/yasumorishima/hormuz-ship-tracker)

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

### 67% Anchored Ratio

Of ~290 monitored vessels, about 67% were stationary (speed < 0.5 knots). In a typical port area, this ratio is usually around 30–40%. The elevated value is notable.

### 35 Vessels Waiting 6+ Hours

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

### Near-Zero Strait Transits

A virtual gate line across the narrowest point of the Strait of Hormuz detects vessel crossings automatically. Only 1 transit was detected in 24 hours.

**Important caveat**: aisstream.io's free tier relies on **terrestrial AIS receivers**. Coverage in the open water of the Strait is limited. "No data" doesn't necessarily mean "no ships" — satellite AIS would provide a more complete picture.

### Traffic Concentrated Around UAE Coast

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

## Limitations

- **Terrestrial AIS coverage**: Free aisstream.io data comes from shore-based receivers. Open-water coverage (mid-strait) is limited
- **AIS speed 102.3 knots**: This is the "not available" sentinel value (0x3FF in the AIS spec) — not an actual speed. Must be filtered
- **Collection period**: Only a few days of data so far. Long-term trend analysis requires further accumulation

## Summary

Using aisstream.io's free API and a Raspberry Pi 5, this system continuously collects and analyzes vessel traffic across the entire Persian Gulf. The high anchored ratio, the presence of a waiting fleet, and the near-absence of strait transits are all observable in the data.

Data collection continues, and longer-term trends will emerge as the dataset grows.

Data source: [aisstream.io](https://aisstream.io/) / Land polygons: [Natural Earth](https://www.naturalearthdata.com/)
