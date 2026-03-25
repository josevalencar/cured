-- CURED — Clark University Renewable Energy Dashboard
-- Supabase (PostgreSQL) schema for microgrid readings
--
-- Run this in the Supabase SQL Editor after creating a project.

-- readings: one row per minute, all 27 columns from LabVIEW
create table readings (
  id         bigint generated always as identity primary key,
  recorded_at timestamptz not null default now(),

  -- Solar
  pv_volts   real,  -- V, PV panel voltage
  pv_cur     real,  -- A, PV panel current
  pv_pow     real,  -- W, PV panel power

  -- Output
  out_v1     real,  -- V, output channel 1 voltage
  out_v2     real,  -- V, output channel 2 (inactive, all zeros)
  out_pow    real,  -- W, output power

  -- Battery
  batt_v     real,  -- V, battery voltage
  batt_curr  real,  -- A, battery current (sign = direction)
  batt_pow   real,  -- W, battery power

  -- Vertical axis wind turbine
  vawt_dc_v  real,  -- V, VAWT DC voltage
  vawt_rms   real,  -- V, VAWT RMS voltage
  vawt_cur   real,  -- A, VAWT current

  -- Horizontal axis wind turbine
  hawt_cur   real,  -- A, HAWT current
  hawt_bat_v real,  -- V, HAWT battery voltage
  hawt_rms   real,  -- V, HAWT RMS voltage

  -- AC grid
  ac_power   real,  -- W, AC grid power (sign = direction)
  ac_volts   real,  -- V, AC grid voltage (~125V)
  ac_curr    real,  -- A, AC grid current
  ac_cur_rms real,  -- A, AC current RMS
  cos_angle  real,  -- power factor or angle (unconfirmed)

  -- Bus
  re_buss    real,  -- V, renewable energy bus voltage

  -- Other
  rpm        real,  -- RPM (inactive, all zeros)
  out_cur2   real,  -- A, output channel 2 current
  remote_curr real, -- A, remote current measurement
  anemometer real,  -- MPH, wind speed (zeros — Pi network issue)

  -- Time (from LabVIEW)
  date_s     double precision,  -- LabVIEW epoch timestamp (seconds since 1904-01-01)
  time_s     double precision   -- time of day in seconds
);

-- Index for querying today's readings efficiently
create index idx_readings_recorded_at on readings (recorded_at);

-- Enable Row Level Security (Supabase requirement)
alter table readings enable row level security;

-- Allow public read access (dashboard is public)
create policy "Public read access"
  on readings for select
  using (true);

-- Allow inserts from the service role (iMac script uses service key)
create policy "Service insert access"
  on readings for insert
  with check (true);
