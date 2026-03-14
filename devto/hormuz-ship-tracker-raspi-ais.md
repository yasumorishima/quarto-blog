---
title: "Building a Real-Time AIS Ship Tracker for the Strait of Hormuz on Raspberry Pi 5"
published: false
description: A practical walkthrough of building a vessel tracking system using aisstream.io WebSocket API, SQLite, FastAPI, Leaflet.js, and matplotlib — all running in Docker on a Raspberry Pi 5.
tags: python, raspberrypi, docker, fastapi
canonical_url: https://zenn.dev/shogaku/articles/hormuz-ship-tracker-raspi-ais
---

## What This Is

A real-time AIS (Automatic Identification System) vessel tracking system for the Strait of Hormuz, running on a Raspberry Pi 5. This article is a personal study note documenting the build.

The Strait of Hormuz is one of the world's most critical maritime chokepoints, with roughly 20% of global oil transport passing through it.

## AIS Basics

AIS is an international maritime safety system where vessels broadcast their position, speed, course, and identity via VHF radio. Ships over 300 gross tonnage on international voyages are required to carry it.

Two message types matter for this project:

- **PositionReport**: latitude, longitude, speed, course, heading (sent every few seconds to minutes)
- **ShipStaticData**: ship name, type code, destination, dimensions, draught (sent every few minutes)

## Architecture

```
aisstream.io (WebSocket)
       |
       v
 Raspberry Pi 5 (Docker)
 +-----------------------+    +--------------------+
 | ais-collector          |    | snapshot-cron       |
 |  collector.py (WS)    |    |  snapshot.py        |
 |  land_filter.py        |    |  auto_push.sh       |
 |  api.py (FastAPI)      |    |  (cron every 6h)    |
 |  main.py (entrypoint) |    |                     |
 +-----------------------+    +--------------------+
       |         |                     |
   SQLite    Leaflet.js map       GitHub README
   (ais.db)  (port 8002)         (snapshot image)
       |
   Natural Earth 10m
   (land_mask.geojson)
```

The entire system runs as Docker containers on a Raspberry Pi 5, collecting data 24/7.

## Data Source: aisstream.io

[aisstream.io](https://aisstream.io/) provides a free WebSocket API for real-time global AIS data. Registration with a GitHub account gives you an API key. You specify bounding boxes and message types in the subscription message, and only matching data streams in.

## Implementation Details

### WebSocket Collector (collector.py)

Connects to aisstream.io, filters to the Strait of Hormuz bounding box, and stores everything in SQLite.

```python
BBOX = [[23.5, 54.0], [27.5, 58.5]]

subscribe_msg = {
    "APIKey": API_KEY,
    "BoundingBoxes": [BBOX],
    "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
}
```

ShipStaticData and PositionReport arrive as separate messages. Static data (name, type, destination, dimensions) is cached in an in-memory dict keyed by MMSI, then joined with position data on insertion.

```python
static_cache: dict[int, dict] = {}

if msg_type == "ShipStaticData":
    meta = msg.get("Message", {}).get("ShipStaticData", {})
    mmsi = msg.get("MetaData", {}).get("MMSI")
    if mmsi:
        static_cache[mmsi] = {
            "ship_name": meta.get("Name", "").strip(),
            "ship_type": meta.get("Type"),
            "destination": meta.get("Destination", "").strip(),
            "draught": meta.get("MaximumStaticDraught"),
            "length": meta.get("Dimension", {}).get("A", 0)
                    + meta.get("Dimension", {}).get("B", 0),
            "width": meta.get("Dimension", {}).get("C", 0)
                    + meta.get("Dimension", {}).get("D", 0),
        }
```

Ship dimensions in AIS are encoded as four distance values (A/B/C/D from a reference point). A+B = overall length, C+D = overall width.

Auto-reconnection on connection drops:

```python
except (websockets.exceptions.ConnectionClosed, OSError) as e:
    logger.warning("Connection lost: %s -- reconnecting in 10s", e)
    await asyncio.sleep(10)
```

### FastAPI Endpoints (api.py)

Three endpoints serve the frontend:

| Endpoint | Purpose |
|---|---|
| `GET /api/latest` | Latest position per vessel (last 30 min) |
| `GET /api/tracks/{mmsi}?hours=6` | Track history for a specific vessel |
| `GET /api/stats` | Vessel counts by type |

AIS type codes are numeric. The API converts them to readable labels:

```python
SHIP_TYPE_LABELS = {
    range(70, 80): "Cargo",
    range(80, 90): "Tanker",
    range(60, 70): "Passenger",
    range(30, 36): "Fishing/Towing/Dredging",
    range(36, 40): "Military/Sailing/Pleasure",
    range(40, 50): "HSC",
}
```

### Concurrent Execution (main.py)

The collector and FastAPI server run in a single process via `asyncio.gather`:

```python
async def main():
    await asyncio.gather(
        collect(),
        run_server(),
    )
```

### Leaflet.js Live Map (map.html)

A dark-themed map using CARTO dark tiles. Vessels are color-coded by type:

- Tanker: orange
- Cargo: blue
- Passenger: green
- Fishing: purple
- Military: red
- HSC: cyan
- Unknown: gray

Clicking a vessel shows a popup with name, speed, course, flag, destination, and dimensions. A "Show Track (6h)" button draws the vessel's recent path as a dashed polyline.

The map auto-refreshes every 30 seconds:

```javascript
loadVessels();
setInterval(loadVessels, 30000);
```

![Map screenshot — dashed rectangle shows the data collection boundary](https://raw.githubusercontent.com/yasumorishima/hormuz-ship-tracker/master/docs/screenshot.png)

### Land Filter (land_filter.py)

AIS data occasionally includes positions on land — caused by GPS drift or building-mounted AIS repeaters. To filter these out, the system uses [Natural Earth](https://www.naturalearthdata.com/) 10m land polygons cropped to the Persian Gulf region.

```python
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.prepared import prep

# Load and prepare land geometry for fast lookups
with open("data/land_mask.geojson") as f:
    data = json.load(f)
geoms = [shape(feature["geometry"]) for feature in data["features"]]
land = unary_union(geoms)
prepared_land = prep(land)

def is_on_land(lat: float, lon: float) -> bool:
    return prepared_land.contains(Point(lon, lat))
```

Shapely's `prepared geometry` pre-builds an internal R-tree index, making repeated point-in-polygon checks fast — important since AIS messages arrive multiple times per second.

The filter is applied at three layers: the collector (before DB insert), the API (query results), and the snapshot generator. If the land mask file is missing, the filter fails open (no data is dropped), so data collection continues uninterrupted.

The cropped GeoJSON is just 34 KB (26 polygons) and can be regenerated with `scripts/generate_land_mask.py`.

### Matplotlib Snapshot (snapshot.py)

Every 6 hours, a cron job generates a dark-themed static map image from SQLite data. Approximate coastline polygons provide geographic context without requiring shapefile dependencies.

```python
fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0a0a1a")
ax.set_facecolor("#0d1b2a")

for segment in COASTLINE_SEGMENTS:
    lats, lons = zip(*segment)
    ax.plot(lons, lats, color="#2a3a4a", linewidth=1.2, zorder=2)
    ax.fill(lons, lats, color="#111822", alpha=0.6, zorder=1)
```

### Auto-Push with SHA256 Diff (auto_push.sh)

The snapshot is compared against the previous version using SHA256 hashing. If unchanged (e.g., during quiet periods), no commit is created.

```bash
NEW_HASH=$(sha256sum "$SNAPSHOT" | cut -d' ' -f1)
OLD_HASH=$(sha256sum "$DEST_IMG" | cut -d' ' -f1)

if [ "$NEW_HASH" = "$OLD_HASH" ]; then
    echo "No change in snapshot -- skipping push"
    exit 0
fi

git commit -m "snapshot: ${VESSEL_COUNT} vessels at ${TIMESTAMP}"
git push origin HEAD
```

## Docker Setup

Two containers managed by docker-compose:

```yaml
services:
  ais-collector:
    build: .
    container_name: hormuz-tracker
    restart: unless-stopped
    ports:
      - "8002:8002"
    volumes:
      - ./data:/app/data
      - .:/repo

  snapshot-cron:
    build: .
    container_name: hormuz-snapshot
    restart: unless-stopped
    entrypoint: /bin/bash
    command:
      - -c
      - |
        apt-get update -qq && apt-get install -y -qq git cron >/dev/null 2>&1
        echo "0 0,6,12,18 * * * /bin/bash /app/src/auto_push.sh" | crontab -
        /bin/bash /app/src/auto_push.sh || true
        cron -f
    depends_on:
      - ais-collector
```

Both containers share the SQLite database via a volume mount (`./data:/app/data`).

## How to Run

```bash
# Create .env
echo "AISSTREAM_API_KEY=your-api-key" > .env
echo "GITHUB_TOKEN=your-github-token" >> .env
echo "GITHUB_REPO=your-username/hormuz-ship-tracker" >> .env

# Start
docker compose up -d

# Open http://<your-raspberry-pi-ip>:8002
```

## Design Decisions

| Decision | Rationale |
|---|---|
| SQLite over PostgreSQL | Single-file DB, minimal resources on RPi |
| In-memory static cache | StaticData and PositionReport arrive as separate messages |
| SHA256 hash comparison | Avoid unnecessary git commits during quiet hours |
| Single-process collector+API | asyncio.gather is sufficient at this scale |
| Hand-drawn coastline polygons | Avoids shapefile library dependency for snapshot |
| Natural Earth 10m for land filter | 50m/110m were too coarse — missed Qeshm Island and Bandar Abbas coastline |
| Shapely prepared geometry | R-tree index for fast repeated point-in-polygon checks on streaming data |
| Fail-open land filter | If mask is unavailable, data collection continues (availability over accuracy) |

## Summary

Using aisstream.io's WebSocket API, a real-time vessel tracking system for the Strait of Hormuz can be built with relatively little code and deployed on a Raspberry Pi 5 alongside other services. The system collects AIS data continuously, serves a live map via FastAPI + Leaflet.js, and pushes periodic snapshots to GitHub.

Data source: [aisstream.io](https://aisstream.io/)
