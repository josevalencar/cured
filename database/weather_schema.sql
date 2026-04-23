-- CURED — Weather data from WeatherFlow Tempest stations
--
-- Populated every minute by the Vercel cron job at
-- /api/cron/fetch-weather, which polls WeatherFlow's
-- /swd/rest/better_forecast endpoint and extracts
-- `current_conditions` (live sensor data, not the forecast).
--
-- Run this in the Supabase SQL Editor after creating
-- the project, alongside schema.sql.

create table weather_readings (
  id                 bigint generated always as identity primary key,
  recorded_at        timestamptz not null,      -- from WeatherFlow's `time` (Unix epoch)
  station_id         integer not null,          -- 11212 = ClarkWeatherStationBP

  air_temperature    real,   -- °C
  feels_like         real,   -- °C
  dew_point          real,   -- °C
  relative_humidity  real,   -- %
  station_pressure   real,   -- mb (at station elevation)
  sea_level_pressure real,   -- mb (adjusted to sea level)

  wind_avg           real,   -- m/s (1-minute average)
  wind_gust          real,   -- m/s (peak in the last minute)
  wind_direction     smallint, -- degrees (0 = N, 90 = E, ...)

  solar_radiation    real,   -- W/m²
  uv                 real,   -- UV index
  precip_probability smallint, -- %
  conditions         text    -- "Clear", "Rain Possible", etc.
);

-- Dedup: a repeated poll for the same minute becomes a no-op
create unique index weather_readings_station_time_unique
  on weather_readings (station_id, recorded_at);

-- Query pattern: latest N readings for a station, most recent first
create index weather_readings_recorded_at_idx
  on weather_readings (recorded_at desc);

-- RLS: public read, public insert (matching the readings table pattern)
alter table weather_readings enable row level security;

create policy "Public read access"
  on weather_readings for select
  using (true);

create policy "Public insert access"
  on weather_readings for insert
  with check (true);
