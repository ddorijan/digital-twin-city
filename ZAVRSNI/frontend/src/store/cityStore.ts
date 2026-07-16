import { create } from 'zustand';
import type { CityData, SensorType, LiveFeedEntry, MetricSnapshot } from '../types';

export const ALL_SENSOR_TYPES: SensorType[] = [
  'traffic', 'environment', 'energy', 'parking', 'traffic-light',
];

const MAX_FEED = 40;
const MAX_HISTORY = 30;

interface CityStore {
  cityData: CityData | null;
  isConnected: boolean;
  activeFilters: SensorType[];
  liveFeed: LiveFeedEntry[];
  metricsHistory: MetricSnapshot[];
  updateCityData: (data: CityData) => void;
  setConnected: (connected: boolean) => void;
  toggleFilter: (type: SensorType) => void;
}

export const useCityStore = create<CityStore>((set) => ({
  cityData: null,
  isConnected: false,
  activeFilters: [...ALL_SENSOR_TYPES],
  liveFeed: [],
  metricsHistory: [],

  updateCityData: (data) => {
    set((state) => {
      const newEntries: LiveFeedEntry[] = [];

      data.traffic.forEach((t) => {
        if (t.congestionLevel === 'high') {
          const loc = data.locations.find((l) => l.id === t.sensorId);
          newEntries.push({
            id: `${t.sensorId}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            sensorId: t.sensorId,
            sensorName: loc?.name ?? t.sensorId,
            type: 'traffic',
            status: 'critical',
            message: `Velika gužva — ${t.vehicleCount} voz, ${t.averageSpeed.toFixed(0)} km/h`,
          });
        } else if (t.congestionLevel === 'medium') {
          const loc = data.locations.find((l) => l.id === t.sensorId);
          newEntries.push({
            id: `${t.sensorId}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            sensorId: t.sensorId,
            sensorName: loc?.name ?? t.sensorId,
            type: 'traffic',
            status: 'warning',
            message: `Umjerena gužva — ${t.vehicleCount} vozila`,
          });
        }
      });

      data.environment.forEach((e) => {
        const aqi = e.airQuality.aqi;
        if (aqi > 100) {
          const loc = data.locations.find((l) => l.id === e.sensorId);
          newEntries.push({
            id: `${e.sensorId}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            sensorId: e.sensorId,
            sensorName: loc?.name ?? e.sensorId,
            type: 'environment',
            status: 'critical',
            message: `Kritično zagađenje — AQI: ${aqi}`,
          });
        } else if (aqi > 50) {
          const loc = data.locations.find((l) => l.id === e.sensorId);
          newEntries.push({
            id: `${e.sensorId}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            sensorId: e.sensorId,
            sensorName: loc?.name ?? e.sensorId,
            type: 'environment',
            status: 'warning',
            message: `Povišeno zagađenje — AQI: ${aqi}`,
          });
        }
      });

      data.parking.forEach((p) => {
        const pct = (p.occupiedSpaces / p.totalSpaces) * 100;
        if (pct >= 90) {
          const loc = data.locations.find((l) => l.id === p.sensorId);
          newEntries.push({
            id: `${p.sensorId}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            sensorId: p.sensorId,
            sensorName: loc?.name ?? p.sensorId,
            type: 'parking',
            status: 'critical',
            message: `Parking gotovo pun — ${p.availableSpaces} slobodnih`,
          });
        }
      });

      const newFeed =
        newEntries.length > 0
          ? [...newEntries, ...state.liveFeed].slice(0, MAX_FEED)
          : state.liveFeed;

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const snapshot: MetricSnapshot = {
        time: timeStr,
        totalVehicles: data.metrics.totalVehicles,
        averageAirQuality: data.metrics.averageAirQuality,
        totalEnergyConsumption: parseFloat(data.metrics.totalEnergyConsumption.toFixed(1)),
        parkingOccupancy: data.metrics.parkingOccupancy,
      };
      const newHistory = [...state.metricsHistory, snapshot].slice(-MAX_HISTORY);

      return { cityData: data, liveFeed: newFeed, metricsHistory: newHistory };
    });
  },

  setConnected: (connected) => set({ isConnected: connected }),

  toggleFilter: (type) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(type)
        ? state.activeFilters.filter((t) => t !== type)
        : [...state.activeFilters, type],
    })),
}));
