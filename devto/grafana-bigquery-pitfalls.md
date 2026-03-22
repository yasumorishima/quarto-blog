---
title: "5 Pitfalls of Grafana + BigQuery — When Your Dashboard Shows Nothing"
published: true
description: "Real-world issues I hit building 70+ panels across 7 Grafana dashboards with BigQuery. Japanese aliases, time_series format, fieldConfig traps, and more."
tags: grafana, bigquery, gcp, datavisualization
cover_image:
canonical_url:
---

## Introduction

I built 7 Grafana dashboards (70+ panels) on Grafana Cloud with BigQuery as the data source. Along the way, I hit multiple issues where queries returned data through the API but panels showed nothing in the UI.

Here are the 5 pitfalls I encountered and how to fix them. Verified on Grafana 13 + BigQuery datasource plugin.

## 1. Non-ASCII Column Aliases Need Backticks

### Symptom

`Syntax error: Illegal input character`

### Cause

If you use non-ASCII characters (e.g., Japanese, Chinese) in column aliases, they must be wrapped in backticks.

```sql
-- Fails
SELECT team AS チーム, HR AS 本塁打 FROM ...

-- Works
SELECT team AS `チーム`, HR AS `本塁打` FROM ...
```

This also applies to mixed ASCII + non-ASCII aliases like `K率` and references in `GROUP BY` / `ORDER BY` clauses.

## 2. BigQuery Datasource Doesn't Support `format: "time_series"`

### Symptom

`error unmarshaling query JSON to the Query Model: invalid format value: time_series`

### Fix

Always use `format: "table"`. For time series data, return a `TIMESTAMP` column named `time` — Grafana auto-detects it.

```sql
SELECT CAST(date AS TIMESTAMP) AS time, value FROM ...
```

## 3. Historical Data in Timeseries Panels Shows "Data outside time range"

### Symptom

Panel displays "Data outside time range" with a "Zoom to data" button.

### Cause

Timeseries panels filter by the dashboard time range (e.g., "Last 6 hours"). Historical data from 2015–2025 falls outside this range.

### Fix

Use **barchart panels** for historical aggregations. Return the year as a string:

```sql
SELECT CAST(year AS STRING) AS year, value FROM ...
```

## 4. Extra fieldConfig Properties Can Break Barchart Rendering

### Symptom

Barchart panel is completely blank. No error message. Query returns data when tested directly.

### Cause

In Grafana 13, adding `color`, `decimals`, `unit`, or `custom.axisLabel` to `fieldConfig.defaults` can silently prevent barchart rendering.

```json
// Broken — renders nothing
"fieldConfig": {
  "defaults": {
    "color": {"fixedColor": "#5470c6", "mode": "fixed"},
    "decimals": 0,
    "unit": "none"
  }
}

// Works
"fieldConfig": {
  "defaults": {},
  "overrides": []
}
```

Start with minimal config, verify it renders, then add properties one at a time.

## 5. Panels Inside Expanded Row's `panels` Array Are Invisible

### Symptom

Panels exist in the dashboard JSON but don't appear in the UI.

### Cause

Grafana row panels have two modes:

- **Collapsed (`collapsed: true`)**: child panels stored in the row's `panels` array
- **Expanded (`collapsed: false`)**: child panels must be **top-level siblings** after the row. The row's `panels` array must be empty.

If `collapsed: false` but the `panels` array still contains panels, those panels are invisible.

```json
// Broken — panels inside expanded row are hidden
{
  "type": "row",
  "collapsed": false,
  "panels": [{"type": "barchart", "title": "Hidden Panel"}]
}

// Fixed — panels at top level after the row
{"type": "row", "collapsed": false, "panels": []},
{"type": "barchart", "title": "Visible Panel"}
```

Also check `gridPos.y` — if a panel's Y position is above its row header, it won't appear in the expected section.

## Conclusion

Grafana + BigQuery is a powerful combination, but building dashboards via the API exposes issues you'd never encounter through the UI editor. The hardest to debug: "query is correct but panel is blank." Hope this saves you some time.
