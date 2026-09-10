import { createAlert } from '../../database/index.js';
import type { Alert } from '../../database/services/eventService.js';
import type { generateAllData } from './dataGenerator.js';

type CityData = ReturnType<typeof generateAllData>;
type CreatedAlert = Alert & { id: number };

// Per (sensorId + alertType) cooldown so the 3s simulation tick doesn't flood
// the alerts table with a new row every time a threshold is still exceeded.
const COOLDOWN_MS = 15 * 60 * 1000;
const lastAlertAt = new Map<string, number>();

function shouldFire(key: string): boolean {
  const last = lastAlertAt.get(key) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) return false;
  lastAlertAt.set(key, Date.now());
  return true;
}

/**
 * Inspect the latest simulation tick and persist real DB alerts for sensors
 * that cross a threshold, instead of only showing ephemeral frontend toasts.
 */
export function evaluateAlerts(data: CityData): CreatedAlert[] {
  const created: CreatedAlert[] = [];

  const fire = (alert: Alert) => {
    const id = createAlert(alert);
    created.push({ ...alert, id });
  };

  data.environment.forEach((e) => {
    const aqi = e.airQuality.aqi;
    if (aqi > 100 && shouldFire(`${e.sensorId}:high_pollution`)) {
      fire({
        sensor_id: e.sensorId,
        alert_type: 'high_pollution',
        severity: aqi > 150 ? 'critical' : 'warning',
        message: `Visoka razina zagađenja zraka (AQI ${aqi})`,
        threshold_value: 100,
        actual_value: aqi,
      });
    }
  });

  data.parking.forEach((p) => {
    const pct = (p.occupiedSpaces / p.totalSpaces) * 100;
    if (pct >= 95 && shouldFire(`${p.sensorId}:parking_full`)) {
      fire({
        sensor_id: p.sensorId,
        alert_type: 'parking_full',
        severity: 'warning',
        message: `Parking gotovo pun (${p.occupiedSpaces}/${p.totalSpaces} mjesta)`,
        threshold_value: 95,
        actual_value: Math.round(pct),
      });
    }
  });

  data.traffic.forEach((t) => {
    if (t.congestionLevel === 'high' && shouldFire(`${t.sensorId}:traffic_jam`)) {
      fire({
        sensor_id: t.sensorId,
        alert_type: 'traffic_jam',
        severity: 'warning',
        message: `Velika gužva u prometu (${t.vehicleCount} vozila, ${t.averageSpeed.toFixed(0)} km/h)`,
        threshold_value: 60,
        actual_value: t.vehicleCount,
      });
    }
  });

  return created;
}
