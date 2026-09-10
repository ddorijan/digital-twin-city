const API_URL = 'http://localhost:3001/api/events';

export interface CityEventDto {
  id: number;
  event_type: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  severity: string;
  status: string;
  created_at?: string;
}

/** Active accident-type events - the shared "ground truth" for simulated crashes. */
export async function fetchActiveIncidents(): Promise<CityEventDto[]> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events ?? []).filter((e: CityEventDto) => e.event_type === 'accident');
  } catch {
    return [];
  }
}

export async function createIncidentEvent(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'accident',
        title: 'Prometni sudar',
        lat,
        lng,
        severity: 'critical',
        status: 'active',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.event_id ?? null;
  } catch {
    return null;
  }
}

export async function resolveIncidentEvent(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/${id}/resolve`, { method: 'PUT' });
    return res.ok;
  } catch {
    return false;
  }
}
