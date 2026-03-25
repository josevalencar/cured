#!/usr/bin/env python3
"""
CURED — Push latest microgrid reading to Supabase.

Reads the last complete line of today's PowCrv file (written by LabVIEW every minute)
and POSTs the 27 values to the Supabase readings table.

Skips the push if the data hasn't changed since the last successful push
(uses the date_s column as a unique identifier for each reading).

Designed for Python 3.6+ on macOS Catalina. No pip installs needed.

Usage:
    python3 /Users/microuser/push_reading.py

Cron (every minute):
    * * * * * /usr/bin/python3 /Users/microuser/push_reading.py >> /Users/microuser/push_reading.log 2>&1
"""

import json
import sys
import os
from datetime import datetime

# Python 3.6 compatible HTTP
try:
    from urllib.request import Request, urlopen
    from urllib.error import URLError, HTTPError
except ImportError:
    print("ERROR: Python 3 required")
    sys.exit(1)

# --- Configuration ---
# Replace these with your Supabase project values
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://YOUR_PROJECT.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "YOUR_SERVICE_ROLE_KEY")
# On the iMac, the real values are hardcoded in /Users/microuser/push_reading.py

DATA_DIR = "/Users/microuser/Data/2021"

# File numbering: PowCrv.001 = 2022, .002 = 2023, ..., .005 = 2026
YEAR_OFFSET = 2021

# Tracks the last pushed reading to avoid duplicates
LAST_PUSH_FILE = "/Users/microuser/.last_push_date_s"

# Column names matching the LabVIEW header (in order)
COLUMNS = [
    "pv_volts", "pv_cur", "pv_pow",
    "out_v1", "out_v2", "out_pow",
    "batt_v", "vawt_dc_v", "rpm", "re_buss",
    "vawt_rms", "batt_curr", "vawt_cur",
    "out_cur2", "remote_curr",
    "hawt_cur", "hawt_bat_v", "hawt_rms",
    "ac_power", "ac_volts", "ac_curr", "cos_angle",
    "batt_pow",
    "date_s", "time_s",
    "ac_cur_rms", "anemometer",
]


def get_todays_file():
    """Build the path to today's PowCrv file."""
    now = datetime.now()
    # Folder name: MonDD (e.g., Mar25)
    folder = now.strftime("%b") + str(now.day)
    # File number: year - 2021, zero-padded to 3 digits
    file_num = now.year - YEAR_OFFSET
    filename = "PowCrv.{:03d}".format(file_num)
    return os.path.join(DATA_DIR, folder, filename)


def read_latest():
    """Read the last complete line (27 tab-separated values) from today's file."""
    filepath = get_todays_file()
    if not os.path.exists(filepath):
        raise FileNotFoundError("File not found: {}".format(filepath))

    with open(filepath, "r") as f:
        lines = f.readlines()

    # Walk backwards to find the last complete line with 27 values
    for line in reversed(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith("PV"):
            continue
        values = stripped.split()
        if len(values) == 27:
            row = {}
            for col, val in zip(COLUMNS, values):
                row[col] = float(val)
            return row

    raise ValueError("No complete data line found in {}".format(filepath))


def already_pushed(date_s):
    """Check if this exact date_s was already pushed."""
    try:
        with open(LAST_PUSH_FILE, "r") as f:
            last = f.read().strip()
        return last == str(date_s)
    except (IOError, OSError):
        return False


def save_last_push(date_s):
    """Record the date_s of the last successful push."""
    with open(LAST_PUSH_FILE, "w") as f:
        f.write(str(date_s))


def push_to_supabase(row):
    """POST a single reading to the Supabase REST API."""
    url = SUPABASE_URL.rstrip("/") + "/rest/v1/readings"

    body = json.dumps(row).encode("utf-8")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    req = Request(url, data=body, headers=headers, method="POST")
    resp = urlopen(req, timeout=10)
    return resp.status


def main():
    try:
        row = read_latest()
        date_s = row["date_s"]

        if already_pushed(date_s):
            return

        status = push_to_supabase(row)
        save_last_push(date_s)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print("{} OK ({}) pv_volts={:.2f}".format(now, status, row["pv_volts"]))
    except (HTTPError, URLError) as e:
        print("ERROR: {}".format(e))
        sys.exit(1)
    except Exception as e:
        print("ERROR: {}".format(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
