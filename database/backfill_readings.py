#!/usr/bin/env python3
"""
CURED — One-shot backfill of historical PowCrv files into Supabase.

Walks /Users/microuser/Data/2021/**/PowCrv.* (covers 2021–present, since
LabVIEW stores all files under the 2021/ root regardless of actual year),
parses every minute-level row, and inserts in batches into the readings
table.

Idempotent: relies on the UNIQUE INDEX on readings.date_s + PostgREST
`resolution=ignore-duplicates`. Safe to stop and re-run; rows that
already exist are silently skipped.

The live push_reading.py cron can keep running in parallel — same dedup
rule applies.

Usage on the iMac (in the background, survives SSH disconnect):
    nohup /usr/bin/python3 /Users/microuser/backfill_readings.py \
        > /Users/microuser/backfill_readings.log 2>&1 &

Tail progress with:
    tail -f /Users/microuser/backfill_readings.log
"""

import glob
import json
import math
import os
import sys
import time
from datetime import datetime, timezone

try:
    from urllib.request import Request, urlopen
    from urllib.error import URLError, HTTPError
except ImportError:
    print("ERROR: Python 3 required")
    sys.exit(1)

# --- Configuration ---
# On the iMac, real values are hardcoded in /Users/microuser/backfill_readings.py
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://YOUR_PROJECT.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "YOUR_SERVICE_ROLE_KEY")

DATA_ROOT = "/Users/microuser/Data/2021"
BATCH_SIZE = 500

# LabVIEW counts seconds since 1904-01-01 UTC; Unix counts since 1970-01-01 UTC.
LABVIEW_EPOCH_OFFSET = 2082844800

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


def log(msg):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("{} {}".format(now, msg), flush=True)


def parse_row(line):
    """Turn one tab/space-separated data line into a dict, or None if malformed.

    Accepts both the modern 27-column format (2024+) and the 26-column
    format used in 2022–2023 (anemometer column did not exist yet).
    For 26-col rows, anemometer is set to NULL.
    """
    values = line.strip().split()
    if len(values) == 27:
        cols = COLUMNS
    elif len(values) == 26:
        cols = COLUMNS[:-1]  # all except trailing "anemometer"
    else:
        return None

    row = {c: None for c in COLUMNS}
    for col, val in zip(cols, values):
        try:
            f = float(val)
        except ValueError:
            return None
        if math.isnan(f) or math.isinf(f):
            f = None
        row[col] = f
    if row["date_s"] is None:
        return None
    return row


def parse_file(path):
    rows = []
    try:
        with open(path, "r") as f:
            for line in f:
                stripped = line.strip()
                if not stripped or stripped.startswith("PV"):
                    continue
                row = parse_row(stripped)
                if row is not None:
                    rows.append(row)
    except (IOError, OSError) as e:
        log("  read error on {}: {}".format(path, e))
    return rows


def push_batch(batch):
    url = SUPABASE_URL.rstrip("/") + "/rest/v1/readings?on_conflict=date_s"
    body = json.dumps(batch, allow_nan=False).encode("utf-8")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
    }
    req = Request(url, data=body, headers=headers, method="POST")
    resp = urlopen(req, timeout=60)
    return resp.status


def push_with_retry(batch):
    attempt = 0
    while True:
        try:
            return push_batch(batch)
        except (HTTPError, URLError) as e:
            attempt += 1
            if attempt > 4:
                log("  giving up on batch of {} after 4 retries: {}".format(len(batch), e))
                return None
            wait = 2 ** attempt
            log("  retry {} after error: {} (sleeping {}s)".format(attempt, e, wait))
            time.sleep(wait)


def main():
    pattern = os.path.join(DATA_ROOT, "*", "PowCrv.*")
    files = sorted(glob.glob(pattern))
    log("found {} files under {}".format(len(files), DATA_ROOT))

    if not files:
        log("nothing to do")
        return

    total_parsed = 0
    total_pushed = 0
    for i, path in enumerate(files, 1):
        rel = path.replace(DATA_ROOT + "/", "")
        rows = parse_file(path)
        if not rows:
            log("[{}/{}] {} — no parseable rows, skip".format(i, len(files), rel))
            continue

        # Compute recorded_at from date_s. LabVIEW timestamps are UTC.
        for r in rows:
            unix_ts = r["date_s"] - LABVIEW_EPOCH_OFFSET
            try:
                r["recorded_at"] = datetime.fromtimestamp(
                    unix_ts, tz=timezone.utc
                ).isoformat()
            except (OverflowError, OSError, ValueError):
                # Garbage timestamps (e.g. corrupt rows). Drop them.
                r["recorded_at"] = None

        rows = [r for r in rows if r["recorded_at"] is not None]
        total_parsed += len(rows)

        for start in range(0, len(rows), BATCH_SIZE):
            chunk = rows[start:start + BATCH_SIZE]
            status = push_with_retry(chunk)
            if status is not None:
                total_pushed += len(chunk)

        log("[{}/{}] {} — {} rows (cum parsed={}, pushed={})".format(
            i, len(files), rel, len(rows), total_parsed, total_pushed
        ))

    log("DONE — parsed {} rows from {} files; sent {} to Supabase".format(
        total_parsed, len(files), total_pushed
    ))


if __name__ == "__main__":
    main()
