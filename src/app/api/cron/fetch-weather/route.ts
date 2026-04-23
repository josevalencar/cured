import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_STATION_ID = 11212 // ClarkWeatherStationBP

type CurrentConditions = {
  time: number
  air_temperature?: number
  feels_like?: number
  dew_point?: number
  relative_humidity?: number
  station_pressure?: number
  sea_level_pressure?: number
  wind_avg?: number
  wind_gust?: number
  wind_direction?: number
  solar_radiation?: number
  uv?: number
  precip_probability?: number
  conditions?: string
}

type BetterForecastResponse = {
  status?: { status_code: number; status_message: string }
  current_conditions?: CurrentConditions
}

export async function GET(request: Request) {
  const token = process.env.WEATHERFLOW_TOKEN
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const cronSecret = process.env.CRON_SECRET
  const stationId = Number(process.env.WEATHERFLOW_STATION_ID ?? DEFAULT_STATION_ID)

  const authHeader = request.headers.get("authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!token || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "missing env config", missing: {
        WEATHERFLOW_TOKEN: !token,
        NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey,
      } },
      { status: 500 }
    )
  }

  const url = `https://swd.weatherflow.com/swd/rest/better_forecast?station_id=${stationId}&api_key=${token}`
  let data: BetterForecastResponse
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      return NextResponse.json(
        { error: "weatherflow http error", status: res.status },
        { status: 502 }
      )
    }
    data = (await res.json()) as BetterForecastResponse
  } catch (err) {
    return NextResponse.json(
      { error: "weatherflow fetch failed", detail: String(err) },
      { status: 502 }
    )
  }

  if (data.status?.status_code !== 0) {
    return NextResponse.json(
      { error: "weatherflow api error", detail: data.status },
      { status: 502 }
    )
  }

  const cc = data.current_conditions
  if (!cc?.time) {
    return NextResponse.json(
      { error: "no current_conditions in response" },
      { status: 502 }
    )
  }

  const row = {
    station_id: stationId,
    recorded_at: new Date(cc.time * 1000).toISOString(),
    air_temperature: cc.air_temperature ?? null,
    feels_like: cc.feels_like ?? null,
    dew_point: cc.dew_point ?? null,
    relative_humidity: cc.relative_humidity ?? null,
    station_pressure: cc.station_pressure ?? null,
    sea_level_pressure: cc.sea_level_pressure ?? null,
    wind_avg: cc.wind_avg ?? null,
    wind_gust: cc.wind_gust ?? null,
    wind_direction: cc.wind_direction ?? null,
    solar_radiation: cc.solar_radiation ?? null,
    uv: cc.uv ?? null,
    precip_probability: cc.precip_probability ?? null,
    conditions: cc.conditions ?? null,
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { error } = await supabase
    .from("weather_readings")
    .upsert(row, {
      onConflict: "station_id,recorded_at",
      ignoreDuplicates: true,
    })

  if (error) {
    return NextResponse.json(
      { error: "supabase insert failed", detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    station_id: stationId,
    recorded_at: row.recorded_at,
    air_temperature: row.air_temperature,
    wind_avg: row.wind_avg,
    solar_radiation: row.solar_radiation,
    conditions: row.conditions,
  })
}
