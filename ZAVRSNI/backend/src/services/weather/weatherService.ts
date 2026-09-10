// Real current weather + air quality for Đakovo (Open-Meteo, no API key required).
// Polled periodically and cached so the 3s simulation tick can read it synchronously.

const DAKOVO_LAT = 45.3089;
const DAKOVO_LNG = 18.4107;
const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

interface WeatherSnapshot {
  temperature: number;
  humidity: number;
  pm25: number;
  pm10: number;
  aqi: number;
  isLive: boolean;
}

const FALLBACK: WeatherSnapshot = {
  temperature: 22,
  humidity: 55,
  pm25: 20,
  pm10: 35,
  aqi: 45,
  isLive: false,
};

let cached: WeatherSnapshot = FALLBACK;

export const getCurrentWeather = (): WeatherSnapshot => cached;

async function refreshWeather(): Promise<void> {
  try {
    const [weatherRes, airRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${DAKOVO_LAT}&longitude=${DAKOVO_LNG}` +
        `&current=temperature_2m,relative_humidity_2m&timezone=auto`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${DAKOVO_LAT}&longitude=${DAKOVO_LNG}` +
        `&current=pm2_5,pm10,european_aqi&timezone=auto`
      ),
    ]);

    if (!weatherRes.ok || !airRes.ok) throw new Error(`weather=${weatherRes.status} air=${airRes.status}`);

    const weather = await weatherRes.json() as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number };
    };
    const air = await airRes.json() as {
      current?: { pm2_5?: number; pm10?: number; european_aqi?: number };
    };

    cached = {
      temperature: weather?.current?.temperature_2m ?? cached.temperature,
      humidity: weather?.current?.relative_humidity_2m ?? cached.humidity,
      pm25: air?.current?.pm2_5 ?? cached.pm25,
      pm10: air?.current?.pm10 ?? cached.pm10,
      aqi: air?.current?.european_aqi ?? cached.aqi,
      isLive: true,
    };
    console.log(`🌤️  Weather updated: ${cached.temperature}°C, ${cached.humidity}% humidity, AQI ${cached.aqi}`);
  } catch (error) {
    console.error('⚠️  Failed to fetch live weather, keeping last known/fallback values:', error);
  }
}

export function startWeatherPolling(): void {
  void refreshWeather();
  setInterval(refreshWeather, POLL_INTERVAL_MS).unref();
}
