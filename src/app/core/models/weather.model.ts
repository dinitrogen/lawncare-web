export interface WeatherReading {
  id: string;
  timestamp: string;
  outdoorTempC: number | null;
  outdoorHumidityPct: number | null;
  windSpeedKmh: number | null;
  windGustKmh: number | null;
  windDirectionDeg: number | null;
  rainRateMmh: number | null;
  dailyRainMm: number | null;
  weeklyRainMm: number | null;
  monthlyRainMm: number | null;
  pressureRelHpa: number | null;
  pressureAbsHpa: number | null;
  solarRadiationWm2: number | null;
  uvIndex: number | null;
  indoorTempC: number | null;
  indoorHumidityPct: number | null;
  soilMoisturePct: number[] | null;
  stationType: string | null;
  feelsLikeC: number | null;
}
