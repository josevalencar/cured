#!/usr/bin/env python3
"""
CURED — Push latest WeatherFlow Tempest reading to Supabase.

Hits the WeatherFlow `/better_forecast` endpoint for the BP rooftop
station (station_id 11212), extracts `current_conditions`, and POSTs
the row into the Supabase `weather_readings` table.

Skips the push if the reading's `time` field hasn't changed since the
last successful push (avoids duplicate inserts when WeatherFlow's
sample cadence is slower than our cron interval).

Designed for Python 3.6+ on macOS Catalina. No pip installs needed.

Usage:
    python3 /Users/microuser/push_weather.py

Cron (every minute):
    * * * * * /usr/bin/python3 /Users/microuser/push_weather.py >> /Users/microuser/push_weather.log 2>&1
"""

import json
import os
import sys
from datetime import datetime, timezone

try:
    from urllib.request import Request, urlopen
    from urllib.error import URLError, HTTPError
    from urllib.parse import quote
except ImportError:
    print("ERROR: Python 3 required")
    sys.exit(1)

# --- Configuration ---
# Replace these with your Supabase project values + WeatherFlow token.
# On the iMac, the real values are hardcoded in /Users/microuser/push_weather.py
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://YOUR_PROJECT.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "YOUR_SERVICE_ROLE_KEY")
WEATHERFLOW_TOKEN = os.environ.get("WEATHERFLOW_TOKEN", "YOUR_TOKEN")
STATION_ID = int(os.environ.get("WEATHERFLOW_STATION_ID", "11212"))

LAST_PUSH_FILE = "/Users/microuser/.last_push_weather_time"

# Fields copied verbatim from current_conditions into the row
FIELDS = [
    "air_temperature", "feels_like", "dew_point",
    "relative_humidity", "station_pressure", "sea_level_pressure",
    "wind_avg", "wind_gust", "wind_direction",
    "solar_radiation", "uv", "precip_probability", "conditions",
]


def fetch_better_forecast():
    """Call WeatherFlow /better_forecast and return the parsed JSON."""
    url = (
        "https://swd.weatherflow.com/swd/rest/better_forecast"
        "?station_id={}&api_key={}".format(STATION_ID, quote(WEATHERFLOW_TOKEN))
    )
    req = Request(url, headers={"Accept": "application/json"})
    resp = urlopen(req, timeout=10)
    return json.loads(resp.read().decode("utf-8"))


def already_pushed(t):
    try:
        with open(LAST_PUSH_FILE, "r") as f:
            return f.read().strip() == str(t)
    except (IOError, OSError):
        return False


def save_last_push(t):
    with open(LAST_PUSH_FILE, "w") as f:
        f.write(str(t))


def push_to_supabase(row):
    """POST the row to Supabase, ignoring duplicates on (station_id, recorded_at)."""
    url = (
        SUPABASE_URL.rstrip("/")
        + "/rest/v1/weather_readings?on_conflict=station_id,recorded_at"
    )
    body = json.dumps(row).encode("utf-8")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
    }
    req = Request(url, data=body, headers=headers, method="POST")
    resp = urlopen(req, timeout=10)
    return resp.status


def main():
    try:
        data = fetch_better_forecast()

        status = data.get("status") or {}
        if status.get("status_code") != 0:
            print("ERROR: weatherflow status: {}".format(status))
            sys.exit(1)

        cc = data.get("current_conditions") or {}
        t = cc.get("time")
        if not t:
            print("ERROR: no current_conditions.time in response")
            sys.exit(1)

        if already_pushed(t):
            return

        row = {
            "station_id": STATION_ID,
            "recorded_at": datetime.fromtimestamp(t, tz=timezone.utc).isoformat(),
        }
        for field in FIELDS:
            row[field] = cc.get(field)

        code = push_to_supabase(row)
        save_last_push(t)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print("{} OK ({}) temp={} wind_avg={}".format(
            now, code, row.get("air_temperature"), row.get("wind_avg")
        ))
    except (HTTPError, URLError) as e:
        print("ERROR: {}".format(e))
        sys.exit(1)
    except Exception as e:
        print("ERROR: {}".format(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
