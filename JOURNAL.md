# Project Journal — Clark University Microgrid Dashboard
**Session date:** 2026-02-25
**Participants:** José (undergraduate, Prof. Agosta's group)

---

## Overview

There are two projects side by side at `/Users/alencar/Desktop/Clark/PHYS/`:

| Project | Path | Description |
|---|---|---|
| `htdocs_Old` | `./htdocs_Old/` | Original 2019 jQuery/PHP dashboard (Megan McIntyre) |
| `cured` | `./cured/` | Modern Next.js replacement (José, in progress) |

---

## Physical Infrastructure

### Mac Mini — `SolarDat.local`
- **IP:** `140.232.220.201`
- **OS:** macOS Catalina
- **Role:** Web server / database server
- **Software:** MAMP PRO (Apache + MySQL 5.5.42), MySQL Workbench
- **Hosted:** `htdocs_Old` served via MAMP's Apache
- **MySQL data dir:** `/Library/Application Support/appsolute/MAMP PRO/db/mysql/`
- **MySQL socket:** `/Applications/MAMP/tmp/mysql/mysql.sock`
- **MySQL status:** **Running** on port 3306 via MAMP PRO (confirmed 2026-03-18)
- **Start MySQL:** `/Applications/MAMP/bin/mysql/bin/startMysql.sh`
- **MySQL client:** `/Applications/MAMP/Library/bin/mysql -u root -p` (default password: `root`)

### iMac — `140.232.220.200`
- **IP:** `140.232.220.200`
- **OS:** macOS Catalina
- **Role:** Data acquisition
- **Software:** LabVIEW (`SolarPowerMicro.vi`, runs continuously)
- **Writes:** `.txt` data files to `/Users/microuser/Data/YYYY/MonDD/`
- **File naming:** `PowCrv.XXX` where XXX = day of year (e.g. `Crv005.txt` = day 5)
- **MySQL:** NOT installed on this machine

### Raspberry Pi (location uncertain)
- **Role:** USB sensor data collection
- **Runs:** `USB_Insert_Update.py` — reads serial port `/dev/ttyUSB0` at 57,600 baud every 10 seconds
- **Inserts into:** MySQL `USB_Station` table
- **Note:** Anemometer data is all zeros because this Pi is on a different Wi-Fi network than the rest of the system

### Network
- All machines on Clark University's internal subnet `140.232.x.x`
- Not reachable from off-campus without VPN
- Mac Mini and iMac can ping each other

---

## Key Discovery: The `login.php` IP Was Wrong

The old `htdocs_Old/php/login.php` pointed to:
```php
$hn = '140.232.220.200';  // the iMac — MySQL is NOT here
$db = 'Agosta_Micgrid';
$un = 'admin';
$pw = 'energy!';
```

MySQL is actually on the **Mac Mini** (`SolarDat.local` / `127.0.0.1`), running via MAMP PRO. The `140.232.220.200` IP was either outdated (the Mac Mini may have had that IP previously) or simply wrong. This likely explains the "I think, needs testing" comments scattered through the PHP files — the database connection was never fully reliable.

---

## MySQL Database (on Mac Mini via MAMP PRO)

### Known tables (visible in MySQL Workbench tabs):
- `USB_Station` — USB sensor readings (8 channels)
- `Solar`
- `Horizontal_Wind`
- `Vertical_Wind`
- `Weather_Station_BP`
- (and others from the databrowser: `Battery`, `System_Status`, `Weather_Station_GL`, `Power_Prediction`, `Time_Blocks`, `Metadata`, `BP_Power_Usage`)

### Main table: `SYS`
The primary table used by `htdocs_Old`. Columns accessed by index in `status_timer2.js`:

| Index | Column | Meaning |
|---|---|---|
| 0 | `PV_V` | Solar panel voltage (V) |
| 1 | `PV_C` | Solar panel current (A) |
| 2 | `OPower` | Output power (W) |
| 3 | `BPower` | Battery power (W) |
| 5 | `LVTime` | Timestamp (Unix seconds) |
| 6 | `Local_Time` | Local time of day |
| 8 | `WPowerA` | HAWT power (W) |
| 9 | `GPower` | Grid power (W) |
| 10 | `WPowerB` | VAWT power (W) |
| — | `BAT_V` | Battery voltage (V) |
| — | `Data_Day` | Date string `YYYY-MM-DD` (used in WHERE clause) |

---

## `htdocs_Old` — How It Works

**Stack:** HTML + jQuery + Bootstrap + Google Charts + jQuery Flot, served by MAMP Apache, PHP backend, MySQL database.

### Data flow:
```
Sensors → Raspberry Pi (USB serial) → MySQL on Mac Mini → PHP API → jQuery AJAX → Google Charts
LabVIEW (iMac) → .txt files  (separate path, not used by htdocs_Old directly)
```

### PHP endpoints (`/php/`):

| File | Query | Returns |
|---|---|---|
| `query1.php` | `SELECT * FROM SYS WHERE Data_Day = today` | Full day JSON array |
| `query_sys.php` | Latest SYS row (BAT_V, etc.) | Single JSON object |
| `query_sys_hi.php` | Last 240 rows from SYS | JSON array |
| `query_usb.php` | `SELECT * FROM USB_Single` | Single JSON object |

### Frontend polling:
- jQuery AJAX calls every **10 seconds**
- All data processing (power calculations, energy integration) done **client-side** in JavaScript

### Key calculations in `status_timer2.js`:
```javascript
SPower[i] = PV_Vary[i] * PV_Cary[i]          // Solar power = V × I
delt = (LVTime[i] - LVTime[i-1]) / 3600       // Time delta in hours
wattHours += SPower[i] * delt                  // Energy integration
renewFrac = 0.5 + 100*(solOutWh+batOutWh)/(solOutWh+batOutWh+gridOutWh)
carbSave = 1.22 * wattHours / 1000             // lbs CO₂ saved
```

### Sign conventions (resolved from `status_timer2.js`):
- **GPower > 0** → pulling from grid (import). GPower < 0 → exporting to grid
- **BPower > 0** → battery discharging. BPower < 0 → charging
- Negative PV_V and PV_C values are noise — clamped to 0

---

## `cured` — Current State

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts, shadcn/ui.

**Status:** UI complete, running on **mock data**. Real data integration is the next step.

### Data file format (`data/Crv005.txt`):
- Written by LabVIEW on the iMac
- 1,440 rows (1 per minute), 27 tab-separated columns
- Header row is comma-separated, data rows are tab-separated
- Key columns: `PVvolts`, `PVcur`, `PVpow`, `BattV`, `BattCurr`, `BattPow`, `HAWTrms`, `VAWTrms`, `acPower`, `ACVolts`, `ACCurr`, `anemometer`, `DateS`, `TimeS`
- **LabVIEW epoch:** `DateS - 2082844800` = Unix timestamp (LabVIEW counts from Jan 1, 1904)

### Unresolved in `cured`'s `CLAUDE.md`:
- `acPower` sign convention — **resolved**: positive = importing from grid (confirmed from `htdocs_Old`)
- `BattPow` sign convention — **resolved**: positive = discharging (confirmed from `htdocs_Old`)
- `CosAngle` — still unclear (power factor or phase angle in radians?)
- `anemometer` — all zeros (Raspberry Pi network issue, known)

### Column mapping between old and new:

| `SYS` table (htdocs_Old) | `MicrogridReading` (cured) | Notes |
|---|---|---|
| `PV_V` | `PVvolts` | direct |
| `PV_C` | `PVcur` | direct |
| `PV_V × PV_C` (computed) | `PVpow` | old computed client-side |
| `BAT_V` | `BattV` | direct |
| `BPower` | `BattPow` | direct |
| `GPower` | `acPower` | direct |
| `WPowerA` | `HAWTrms` | old = power (W), new = RMS voltage (V) — may differ |
| `WPowerB` | `VAWTrms` | same concern |
| `LVTime` | `time` | Unix seconds → HH:MM |
| `Data_Day` | — | used for WHERE filter |

The wind columns are the main uncertainty: the `SYS` table stored computed **power (W)** while the `.txt` files store **RMS voltage (V)**. These may reflect different eras of the sensor setup.

---

## Data Integration Options for `cured`

### Option A: MySQL (recommended if database has current data)
1. Start MySQL on Mac Mini: `/Applications/MAMP/bin/mysql/bin/startMysql.sh`
2. Verify data: `/Applications/MAMP/Library/bin/mysql -u root -p` → `USE Agosta_Micgrid; SHOW TABLES; SELECT COUNT(*) FROM SYS;`
3. Build a Next.js API route (`/api/data`) that queries MySQL via a Node.js MySQL client
4. Connect to `localhost:3306` (same machine) or `SolarDat.local:3306`
5. Map column names to `MicrogridReading` TypeScript interface

### Option B: LabVIEW `.txt` files
1. Confirm LabVIEW is still writing files: `ls /Users/microuser/Data/` on iMac
2. Build a Next.js API route that reads and parses `PowCrv.XXX` for today's date
3. Access files via network share (AFP/SMB) or SSH from Mac Mini → iMac
4. Parse tab-separated rows, convert LabVIEW epoch, return `MicrogridReading[]`

### Next immediate steps:
1. Start MySQL via MAMP PRO on Mac Mini
2. Check if `Agosta_Micgrid` database exists and has recent data
3. Decide between Option A or B based on data freshness
4. Build the Next.js API route accordingly

---

## Open Questions
- Is LabVIEW still actively running on the iMac and writing new files?
- Does the `Agosta_Micgrid` database exist in MAMP's MySQL and does it have recent data?
- What is the Raspberry Pi's current status — is it still collecting USB sensor data?
- What are the actual credentials for MAMP's MySQL? (default MAMP root password is `root`)
- Is the Mac Mini intended to keep running as the server for `cured`, or will `cured` be deployed elsewhere?

---

## Session — 2026-03-18

### Investigated: Spring 2022 student report (Jack Rogerson & Nada Haddad)

Read their final project report for PHYS 243/343. Key findings:
- They built a full MySQL database infrastructure called `Microgrid` in Spring 2022
- Used a `Time_Block_ID` (Unix timestamp) as the primary join key across all tables
- 1440 time blocks/day generated by a Python cron script, 1 week in advance
- Installed two Tempest WeatherFlow weather stations (Goddard Library roof + Biophysics roof)
- Set up Grafana connected to the database for visualization
- Created a GitHub organization: **ClarkTRE** with all archived code

### Confirmed: `Microgrid` database is live on the Mac Mini

Accessed the lab physically. Lab has 3 iMacs + 1 Mac Mini + 1 Raspberry Pi.

**Physical lab network:**
| Machine | IP | Role |
|---|---|---|
| iMac (data acquisition) | `140.232.220.180` | Runs LabVIEW, SSH: `MicrogridUser@140.232.220.180` |
| iMac #2 | `140.232.220.181` (approx) | Unknown role |
| Mac Mini (`SolarDat.local`) | `140.232.220.201` | MySQL server via MAMP PRO |
| Raspberry Pi | `10.21.1.243` | USB sensor data collection |

MySQL on the Mac Mini was running but rejecting remote connections. Fixed by running on the Mac Mini locally:
```sql
GRANT ALL PRIVILEGES ON Microgrid.* TO 'microgrid'@'%' IDENTIFIED BY 'energy!#microgrid2017';
FLUSH PRIVILEGES;
```

**Working connection string:**
```bash
mysql -h 140.232.220.201 -u microgrid -p'energy!#microgrid2017' Microgrid
```

### `Microgrid` database tables and row counts

| Table | Rows | Status |
|---|---|---|
| AC | 1,047,849 | Has data |
| BP_Power_Usage | 347,661 | Has data |
| Battery | 241,403 | Has data |
| Horizontal_Wind | 241,403 | Has data |
| Vertical_Wind | 241,403 | Has data |
| System_Status | 241,471 | Has data |
| Solar | 241,400 | Has data |
| Time_Block_ID | 264,893 | Has data |
| USB_Station | 64,260 | Has data |
| Time_Blocks | 15,457 | Has data |
| Weather_Prediction | 15,041 | Has data |
| Weather_Station_BP | 0 | Empty |
| WeatherFlow_Weather_Station_BP | 0 | Empty |
| USB_Solar_Panels_Bistro | 0 | Empty |
| Power_Prediction | 0 | Empty |
| Metadata | 0 | Empty |
| microgrid_status | 0 | Empty |
| Weather_Station_GL | 0 | Empty |

### Next steps (from 2026-03-18)
- ~~Run `SELECT MAX(Time_Stamp) FROM Time_Blocks` to determine how recent the data is~~ DONE (2026-03-25)
- ~~Explore schema of `Solar`, `Battery`, `AC` tables~~ DONE (2026-03-25)
- ~~Decide: connect CURED directly to this MySQL database as the backend data source~~ RESOLVED: No — use `.txt` files instead
- The `Agosta_Micgrid` database (used by `htdocs_Old`) may also still exist on the Mac Mini — check with MAMP root credentials

---

## Session — 2026-03-25

### Database data is stale (2019–2020)

Explored the `Microgrid` database schema and date ranges:

| Table | Latest data | Schema |
|---|---|---|
| Time_Blocks | 2018-05-03 | `Block_Time_ID` (auto_increment), `Block_Timestamp` (datetime) — hourly, old system |
| Time_Block_ID | 2020-01-16 | `Time_Block_ID` (Unix timestamp), `time_stamp` — per-minute, Rogerson/Haddad system |
| Solar | 2020-01-09 | `PV_Voltage`, `PV_Current`, `Time_Stamp`, `Time_Block_ID` |
| Battery | 2020-01-09 | `Battery_Voltage1`, `Battery_Current1`, `Battery_Current2`, `Time_Stamp`, `Time_Block_ID` |
| System_Status | 2020-01-09 | `Out_Voltage1/2`, `Out_Current1/2`, `Out_Power`, `Grid_Pull_Current/Voltage/Power`, `Time_Stamp`, `Time_Block_ID` |
| AC | 2019-10-30 | `Local_Time`, `mtu`, `ct3`, `ct14`, `ct16a`, `ct16b`, `ct18`, `ct19`, `ct25` — different schema, no Time_Block_ID |

**Conclusion:** The database ingestion pipeline died around January 2020 (pre-COVID). The Rogerson/Haddad 2022 work improved the schema but did not revive the data flow from LabVIEW to MySQL.

### LabVIEW is still writing — live data confirmed

`oneline.txt` and `DataDate.txt` updated today (2026-03-25 14:14). LabVIEW (`SolarPowerMicro.vi`) is actively running on the iMac.

**File structure:**
```
/Users/microuser/Data/2021/MonDD/
  PowCrv.NNN
```
- Folders are named by day: `Jan01`, `Feb14`, `Mar25`, etc.
- All folders live under `2021/` (LabVIEW started this structure in 2021)
- File numbering = year offset from 2021:
  - `PowCrv.001` → 2022
  - `PowCrv.002` → 2023
  - `PowCrv.003` → 2024
  - `PowCrv.004` → 2025
  - `PowCrv.005` → 2026 (current)
- The original unnumbered files in each folder are 2021 data

**Today's file:** `/Users/microuser/Data/2021/Mar25/PowCrv.005`
- Header: comma-separated, 27 columns matching CLAUDE.md
- Data: tab-separated, one row per minute
- 858 lines at ~2:28 PM = 857 minutes of data (on track for 1440)

### Decision: CURED backend should read `.txt` files, not MySQL

The MySQL database is historical only (2019–2020). The live data source is the LabVIEW `.txt` files on the iMac (`140.232.220.180`). CURED's data pipeline should:
1. Read files from the iMac via SSH/SCP/rsync or network share
2. Parse the tab-separated format with the 27 columns
3. Use the file naming convention (`2021/MonDD/PowCrv.NNN`) to find the right file for any date

### Supabase cloud database set up

Created a Supabase (PostgreSQL) project to receive live data from the iMac.

- **Project URL:** `https://jrnxfcyskitdyewxnnzd.supabase.co`
- **Region:** US East (North Virginia)
- **Table:** `readings` — 27 columns matching the LabVIEW output + `id` + `recorded_at`
- **RLS policies:** public read, service-role insert
- **Schema:** `database/schema.sql`

### Data pipeline: iMac → Supabase

Deployed a Python script (`push_reading.py`) to the iMac at `/Users/microuser/push_reading.py`.

**How it works:**
1. Reads `oneline.txt` (primary, updated by LabVIEW in real time)
2. Falls back to last complete line of today's most recent `PowCrv.*` file
3. Compares `date_s` with last pushed value (stored in `/Users/microuser/.last_push_date_s`)
4. Only pushes to Supabase if the reading is new — no duplicates when LabVIEW is paused
5. Runs every minute via cron: `* * * * * /usr/bin/python3 /Users/microuser/push_reading.py`
6. Logs to `/Users/microuser/push_reading.log`

**Key issues discovered and fixed:**
- `oneline.txt` does NOT always update consistently — sometimes LabVIEW stops writing to it
- PowCrv files can have partial last lines (LabVIEW mid-write) — script skips lines with != 27 values
- PowCrv file numbering is NOT strictly year-based — LabVIEW increments when restarted (e.g., PowCrv.006 appeared mid-day). Script now finds the most recently modified PowCrv file via `glob` + `os.path.getmtime`
- File numbering note updated: the numbering resets/increments when LabVIEW VI is restarted, not tied to year

**First live data confirmed:** `pv_volts=41.40`, `ac_power=-43.4W`, `batt_v=205.6V`

### Frontend wired to Supabase

- Installed `@supabase/supabase-js`
- Created `src/lib/supabase.ts` — Supabase client using anon key (safe for client-side)
- Created `src/lib/microgrid-data.ts` — `fetchTodayReadings()` queries Supabase, maps rows to `MicrogridReading`, computes metrics with 1-minute intervals (not 15-min like mock data)
- Updated `src/app/page.tsx`:
  - Loads live data from Supabase on mount
  - Falls back to mock data if Supabase is empty or unreachable
  - Shows "Live" (green) or "Mock data" (yellow) badge
  - Auto-refreshes every 60 seconds
  - Shows reading count when live
- `.env.local` holds Supabase URL and anon key (gitignored)

### SSH key set up

Generated SSH key on José's MacBook and attempted to set up passwordless access to iMac. The iMac uses keyboard-interactive auth (not standard password), so key-based auth alone doesn't work. Using `expect` + password for automated SSH/SCP from Claude Code.

### LabVIEW observations

- `SolarPowerMicro.vi` located at `/Users/microuser/LabviewVI/SolarPowerMicro.vi` (last modified 2026-03-13)
- LabVIEW VI directory has ~40 `.vi` files (binary, not readable)
- LabVIEW can stop writing mid-session — PowCrv.005 stopped at 14:30 with a partial last line
- Restarting the VI creates a new PowCrv file with incremented number (PowCrv.006)
- `oneline.txt` is the most reliable real-time source when LabVIEW is running

### Next steps
- Backfill historical data from PowCrv files into Supabase for richer charts
- Monitor pipeline reliability over the next few days
- Consider deploying CURED to Vercel (can read from Supabase from anywhere)
- Confirm sign conventions with Professor Agosta

---

## Session — 2026-04-22

### Anemometer pipeline fixed — Pi → iMac UDP now flowing

Spent the session diagnosing why the `anemometer` column in LabVIEW's output was stuck at zero despite the Pi being "working" per Professor Agosta. Resolved end-to-end.

### What we found

- **Pi was on the wrong network.** On arrival, the Pi (`raspi3a@raspberrypi`) was plugged into the lab's wired Ethernet, getting IP `10.21.2.194` on subnet `10.21.0.0/22`. The iMac is on `140.232.220.180` (subnet `140.232.220.0/24`). Different VLANs.
- **Pi was actually sending.** `AnemometerMPH22.py` was running via Thonny; console showed the UDP send block executing every 15 seconds, targeting the correct `140.232.220.180:61557`. Even with zero wind, the script sends `"0.0"` — so packets should always flow when the Pi is happy.
- **ICMP worked, UDP didn't.** `ping` Pi → iMac = sub-millisecond latency. But `sudo tcpdump -i any -n udp port 61557` on the iMac saw zero packets over 30+ seconds.
- **It wasn't the iMac's firewalls.** Disabled macOS app firewall (`socketfilterfw --setglobalstate off`) AND `pfctl -d`, retested → still zero packets. Local `nc -u -l 62000` + `nc -u 127.0.0.1 62000` worked, confirming the iMac's UDP stack was healthy.
- **Conclusion: UDP is dropped at the campus routing/VLAN layer** between `10.21.0.0/22` and `140.232.220.0/24`. ICMP is permitted for diagnostics; arbitrary inter-VLAN UDP is not. This matches common campus network policies.

### Fix

Professor Agosta moved the Pi onto the **`solar2` Wi-Fi** (password `energy!!!`), which is on the same subnet as the iMac. UDP packets now reach LabVIEW and the `anemometer` column is populating with real values.

### Other paths we considered (and rejected for now)

- **TCP instead of UDP.** Pi-side change was ~7 lines, but LabVIEW's VI would have to be rewritten from UDP listener to TCP listener (stateful: accept → read loop → close, plus message framing). `SolarPowerMicro.vi` is an owned, production VI — risky to modify without the owner.
- **Supabase ingestion from the Pi.** Got as far as drafting a `wind_readings` table + `requests.post` snippet replacing the UDP send. Would have bypassed the campus block via HTTPS. Not needed now that Wi-Fi works, but documented for future reference — this is still the best fallback if the Pi ever gets moved to a network that can't reach the iMac.
- **Direct cable Pi ↔ iMac via USB-Ethernet.** Most self-contained (no IT, no cloud), but requires a hardware adapter and reconfiguring both ends to a private subnet. Overkill given Wi-Fi worked.

### Infrastructure details captured in CLAUDE.md

- Pi identity: `raspi3a@raspberrypi`, script at `/home/raspi3a/Desktop/AnemometerMPH22.py`
- Pi dependency: `pigpio` (input pin 27, requires `pigpiod` daemon)
- Harmless warning on Pi: `libEGL: DRI2 failed to authenticate` — matplotlib GPU init fallback

### Dashboard stale warnings removed

Cleaned up four places in the frontend that still claimed anemometer was offline / Pi was on the wrong network:

- `src/components/dashboard/anemometer-chart.tsx`: badge is now conditional — `"Live"` when any reading > 0, `"Awaiting data"` otherwise. Removed the stale caveat paragraph.
- `src/app/research/page.tsx`: removed the "anemometer unavailable" bullet from the methodology list.
- `src/components/dashboard/research-view.tsx`: removed the `note` prop on the wind turbine subsystem tab.
- `src/components/dashboard/academic-view.tsx`: removed "Wind speed (anemometer) is currently offline" from the methodology paragraph.

`src/lib/mock-data.ts` still emits `anemometer: 0` — left as-is; mock is only used when Supabase is empty/unreachable.

### IP correction

Prior versions of `CLAUDE.md` listed the iMac as `140.232.228.188`. The correct value (per `ifconfig en0` on the iMac) is `140.232.220.180`. Updated both files. The `140.232.228.188` reference is likely a stale holdover from a DHCP lease or a different machine.

### Open items

- Verify anemometer values in Supabase's `readings.anemometer` column start being non-zero at the next `push_reading.py` cron run after the Pi's Wi-Fi change.
- `solar2` Wi-Fi password is documented in CLAUDE.md and JOURNAL.md — consider moving it out of tracked docs if either file is ever pushed to a public repo.

### Follow-up same day — WeatherFlow weather station integration scoped

Professor mentioned other sensors spread across campus. José shared a Rogerson/Haddad-era Python script (`INSERT INTO WeatherFlow_Weather_Station_BP`) that pulls from the WeatherFlow REST API and pushes to MySQL on the Mac Mini.

**Bugs found in the shared script** (likely explain why `WeatherFlow_Weather_Station_BP` is empty in MySQL):
- `mydb.commit` missing parentheses — inserts silently roll back on `mydb.close()`
- The `Weather_username = username_full.split(...)` line uses the MySQL credential variable instead of the WeatherFlow one; dead code because the API key is what actually authenticates
- Response parsing assumes flat JSON (`jData.get('air_temperature')`) but WeatherFlow returns observations as positional arrays under `obs[0]` — so every field comes back `None`
- No error handling on the API call

**Live API test (04/22):**
- The hardcoded key `20c70eae-e62f-4d3b-b3a4-8586e90f3ac8` is **not Clark's**. Listing stations with `GET /swd/rest/stations?api_key=...` returns exactly two stations — one in Texas ("County Rd 348", lat 29.38), one in California ("Lone Eagle Ln", lat 38.64). Neither is at Clark. The script's own comment even flags it: *"we need our own API key (contact company for this) after development is finished."* The dev key was never replaced.
- `device_id=11212` (hardcoded in the script) returns `404 NOT FOUND` — not on this key's authorized list.
- Confirmed working: API reachable from José's Mac, response shape documented (Tempest `obs_st` = 22-element positional array; key positions: 0=timestamp, 2=wind_avg, 4=wind_direction, 6=station_pressure, 7=air_temperature, 8=relative_humidity, 9=brightness, 10=uv, 11=solar_radiation, 15=lightning_strike_count).

**Read Rogerson & Haddad's Spring 2022 final project report (`FinalProjectTREJackNada.pdf`):**
- Two Tempest stations installed Spring 2022: **Goddard Library roof** (hub on 5th floor by corner supply closet) and **Biophysics roof** (hub in 3rd floor Biophysics lab).
- A dedicated Gmail account owns the WeatherFlow account. Gmail + WeatherFlow credentials are in the **ClarkTRE** GitHub org (private). Need to be added as a member.
- Ingest scripts live in ClarkTRE repo **`Archived-Weather_Database-Push`** — contains both the regular 60s operation script and a daily integrity-check script.
- Known hardware risk: even the predecessors (pre-2022) had dead batteries (Goddard) and dropped Wi-Fi (BP). The 2022 stations are 4 years old now — same failures plausible.

**Decision:** pursue weather integration via Supabase (new `weather_readings` table + `push_weather.py`), not by reviving the MySQL pipeline. Consistent with the 2026-03-25 "Supabase as single source of truth" decision.

**Next actions (not started):**
1. Get added to the `ClarkTRE` GitHub organization.
2. Pull the real API key + both `device_id`s from the credentials repo.
3. Sign into `tempestwx.com` with the Clark Gmail to verify both stations are physically online.
4. Only then write `push_weather.py` + Supabase schema + CURED panels.

Documented all of the above in CLAUDE.md under a new "WeatherFlow Tempest Stations" subsection.

---

## Session — 2026-04-23

### Anemometer broke at midnight, root-caused to LabVIEW UDP read loop

José noticed the `anemometer` column went back to zero at 00:00 even though the Pi, the `solar2` Wi-Fi, and the Pi's script were all healthy. Triage:

1. Pi still on `solar2`, still plotting MPH in Thonny → Pi-side fine.
2. `sudo tcpdump -i any -n udp port 61557` on the iMac showed **packets actively arriving** from `192.168.2.8` (the Pi's NAT'd address on `solar2`, 3-byte `"0.0"` and 4-byte `"0.72"` payloads). Network path healthy.
   - Side note: `solar2` is a NAT'd Wi-Fi, **not** the same subnet as the iMac's `140.232.220.0/24` — yesterday's docs implied same-subnet, but packets still route fine over NAT. Corrected in CLAUDE.md.
3. `sudo lsof -iUDP:61557` showed LabVIEW (PID 407) holding the port → VI has the socket bound but isn't draining it. Other acquisition loops (solar, wind) were writing fine to today's PowCrv file, so the main loop was alive; only the UDP read loop stalled.

**Fix:** Abort Execution (⌘+. in LabVIEW) then Run. Anemometer column started populating again within a minute.

**Root cause (hypothesis, not verified):** LabVIEW's typical UDP Read pattern propagates `error in → error out` through the loop; a single error latches the loop into a silent-noop state that survives restarts of the inner code. A bad packet or transient failure at rollover (00:00:00) probably tripped it. Without a block-diagram fix (inserting an error-clear node inside the UDP loop), this is expected to recur at or around midnight.

**Decision:** one problem at a time. Accept daily morning check for now. If it keeps happening, push back on whoever owns `SolarPowerMicro.vi` to add the error clear.

### WeatherFlow integration — scoped, built, pending deploy

José got access to the Clark WeatherFlow account (Gmail → `tempestwx.com`) and generated a personal access token. Full investigation:

**What's live:**
- Station 11212 `ClarkWeatherStationBP` at `(42.25025, -71.82419)` — confirmed Clark's. Tempest web UI shows live 17°C / 25% humidity / 755 mmHg / wind 20 km/h / UV 4.
- Only one station registered under this account. No Goddard Library. Either unregistered, decommissioned, or on a different account.

**Endpoint investigation:**
- `/observations/device/38862` → `obs: null`. The only device paired to this station is hub `HB-00000220`; no `ST` (Tempest) device in the registration, even though a physical Tempest is clearly reporting (confirmed by the web UI showing live data). Device registration is stale — last modified June 2022.
- `/observations/station/11212` → `"DATA_ERROR - location does not have capabilities"`.
- `/better_forecast?station_id=11212` → **works**. Returns both `current_conditions` (live sensor data) and `forecast` (predictions). Despite the confusing endpoint name, `current_conditions` is real observational data, matched field-for-field against the web UI. This is the endpoint to use.

**Fifth bug in the old Rogerson/Haddad script:** it hardcoded `device_id=11212`, but `11212` is the **station_id**, not a device_id. The script was doomed from day one — even with the correct API key, the URL pattern is wrong.

**Architecture pivot:** originally planned an iMac cron Python script (`push_weather.py`) paralleling `push_reading.py`. José suggested Vercel cron instead — correctly. Benefits:
- No lab hardware dependency — weather flows even if iMac is down/disconnected
- Same repo, same language (TypeScript) as the frontend
- No SSH / expect / deploy friction
- Vercel Pro plan allows per-minute cron

Also, my original justification for the pusher included "protects the token" — José pushed back that `.env` (server-only, non-`NEXT_PUBLIC_`) handles this. He's right. The remaining reasons to have a pusher are solid though: building history for charts, keeping the dashboard fast, resilience to WeatherFlow outages, and consistent polling cadence. Kept the architecture, moved to Vercel.

**Shipped:**

- `database/weather_schema.sql` — `weather_readings` table with clean named columns, unique index on `(station_id, recorded_at)` for idempotent inserts, public read/insert RLS.
- `src/app/api/cron/fetch-weather/route.ts` — Next.js API route. Auth guard on `Authorization: Bearer $CRON_SECRET` (Vercel cron sends this automatically), nodejs runtime, force-dynamic. Hits `/better_forecast`, extracts `current_conditions`, upserts into Supabase with `ignoreDuplicates: true`.
- `vercel.json` — `{ "crons": [{ "path": "/api/cron/fetch-weather", "schedule": "* * * * *" }] }`
- CLAUDE.md updated with the new architecture, endpoint choice, and env var list.

**Still needed from José:**
1. Run `database/weather_schema.sql` in Supabase SQL editor.
2. Add env vars in Vercel → Project Settings → Environment Variables (Production + Preview):
   - `WEATHERFLOW_TOKEN=c82cee72-8a2f-475c-8a3e-a0570434aa6d`
   - `SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>`
   - `CRON_SECRET=<openssl rand -hex 32>`
3. Deploy to Vercel; first cron fires within 1 minute.
4. Verify rows in Supabase `weather_readings`, and watch a few Vercel cron runs to catch config issues.
5. **Do not build the frontend panel yet.** Let 1–2 days of `weather_readings` accumulate so charts render with real ranges instead of mock-looking flatlines.

**Open items carried over:**
- Goddard Library station recovery (ask Professor Agosta).
- Anemometer daily midnight failure (monitor; decide whether to fix the VI).
- CURED weather dashboard panel (after data accumulates).
