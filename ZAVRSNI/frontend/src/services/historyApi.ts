const API_URL = 'http://localhost:3001/api/history';

export interface HistoryPoint {
  timestamp: number; // ms, ready for `new Date()`
  value: number | null;
}

type RawReading = { timestamp: number; data: Record<string, unknown> | null; avg_value?: number | null };

const VALUE_EXTRACTORS: Record<string, (data: Record<string, any>) => number | null> = {
  traffic: (d) => d?.vehicleCount ?? null,
  environment: (d) => d?.airQuality?.aqi ?? null,
  energy: (d) => d?.consumption ?? null,
  parking: (d) => (d?.totalSpaces ? Math.round((d.occupiedSpaces / d.totalSpaces) * 100) : null),
};

/** Fetches raw history (works for every sensor type, last-7-days retention window). */
export async function fetchSensorHistory(
  sensorId: string,
  sensorType: string,
  fromSeconds: number,
  toSeconds: number,
): Promise<HistoryPoint[]> {
  try {
    const res = await fetch(`${API_URL}/sensor/${sensorId}?from=${fromSeconds}&to=${toSeconds}&limit=500`);
    if (!res.ok) return [];
    const json = await res.json();
    const extractor = VALUE_EXTRACTORS[sensorType];
    const rows: RawReading[] = json.data ?? [];

    return rows
      .map((row) => ({
        timestamp: row.timestamp * 1000,
        value: row.data ? (extractor?.(row.data) ?? null) : (row.avg_value ?? null),
      }))
      .filter((p): p is HistoryPoint => p.value !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}
