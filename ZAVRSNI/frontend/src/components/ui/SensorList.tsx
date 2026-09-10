import { useMemo, useState } from 'react';
import { Car, Wind, Zap, ParkingSquare, TrafficCone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useCityStore } from '../../store/cityStore';
import type {
  CityData,
  EnergyData,
  SensorLocation,
  SensorStatus,
  SensorType,
  TrafficData,
  TrafficLightData,
} from '../../types';

type SortDir = 'asc' | 'desc';

const TYPE_META: Record<SensorType, { label: string; icon: React.ElementType; accent: string; badge: string }> = {
  traffic:         { label: 'Promet',   icon: Car,           accent: 'text-red-400',    badge: 'bg-red-500/15 text-red-300 border-red-500/30' },
  environment:     { label: 'Okoliš',   icon: Wind,          accent: 'text-green-400',  badge: 'bg-green-500/15 text-green-300 border-green-500/30' },
  energy:          { label: 'Energija', icon: Zap,           accent: 'text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  parking:         { label: 'Parking',  icon: ParkingSquare, accent: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  'traffic-light': { label: 'Semafori', icon: TrafficCone,   accent: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
};

function getStatus(location: SensorLocation, cityData: CityData): SensorStatus {
  switch (location.type) {
    case 'traffic': {
      const d = cityData.traffic.find((t) => t.sensorId === location.id);
      if (!d) return 'normal';
      if (d.congestionLevel === 'high') return 'critical';
      if (d.congestionLevel === 'medium') return 'warning';
      return 'normal';
    }
    case 'environment': {
      const d = cityData.environment.find((e) => e.sensorId === location.id);
      if (!d) return 'normal';
      if (d.airQuality.aqi > 100) return 'critical';
      if (d.airQuality.aqi > 50) return 'warning';
      return 'normal';
    }
    case 'parking': {
      const d = cityData.parking.find((p) => p.sensorId === location.id);
      if (!d) return 'normal';
      const pct = (d.occupiedSpaces / d.totalSpaces) * 100;
      if (pct >= 90) return 'critical';
      if (pct >= 70) return 'warning';
      return 'normal';
    }
    case 'energy': {
      const d = cityData.energy.find((e) => e.sensorId === location.id);
      if (!d) return 'normal';
      if (d.consumption > 80) return 'critical';
      if (d.consumption > 50) return 'warning';
      return 'normal';
    }
    default:
      return 'normal';
  }
}

function StatusBadge({ status }: { status: SensorStatus }) {
  const map = {
    critical: { label: 'Kritično', className: 'bg-red-500/15 text-red-300 border-red-500/40', Icon: XCircle },
    warning:  { label: 'Upozorenje', className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40', Icon: AlertTriangle },
    normal:   { label: 'Normalno', className: 'bg-green-500/15 text-green-300 border-green-500/40', Icon: CheckCircle },
  } as const;
  const item = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${item.className}`}>
      <item.Icon className="w-3 h-3" />
      {item.label}
    </span>
  );
}

function Meter({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-28 bg-gray-700/80 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SortHeader({
  label, active, dir, onClick, align = 'left',
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <th className={`px-3 py-2.5 font-semibold text-gray-400 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-white transition-colors ${active ? 'text-white' : ''}`}
      >
        {label}
        <span className="text-[10px] text-gray-500">{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
}

function useSorted<T>(rows: T[], key: keyof T, dir: SortDir) {
  return useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
      return dir === 'asc'
        ? String(av).localeCompare(String(bv), 'hr')
        : String(bv).localeCompare(String(av), 'hr');
    });
  }, [rows, key, dir]);
}

function ComparisonTable<T extends { id: string }>({
  title,
  type,
  columns,
  rows,
  defaultSort,
}: {
  title: string;
  type: SensorType;
  columns: Array<{
    key: keyof T;
    label: string;
    align?: 'left' | 'right';
    render: (row: T) => React.ReactNode;
  }>;
  rows: T[];
  defaultSort: keyof T;
}) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  const [sortKey, setSortKey] = useState<keyof T>(defaultSort);
  const [dir, setDir] = useState<SortDir>('desc');
  const sorted = useSorted(rows, sortKey, dir);

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) setDir((current) => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setDir('desc');
    }
  };

  return (
    <section className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${meta.accent}`} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${meta.badge}`}>{rows.length}</span>
        </div>
        <p className="text-[11px] text-gray-500">Klikni stupac za sortiranje</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/70 text-xs uppercase tracking-wide">
            <tr>
              {columns.map((column) => (
                <SortHeader
                  key={String(column.key)}
                  label={column.label}
                  active={sortKey === column.key}
                  dir={dir}
                  align={column.align}
                  onClick={() => toggleSort(column.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/40'}>
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-3 py-2.5 border-t border-gray-700/80 ${column.align === 'right' ? 'text-right tabular-nums' : ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface TrafficRow {
  id: string;
  name: string;
  status: SensorStatus;
  statusRank: number;
  vehicleCount: number;
  averageSpeed: number;
  congestion: TrafficData['congestionLevel'];
  congestionRank: number;
}

interface EnvironmentRow {
  id: string;
  name: string;
  status: SensorStatus;
  statusRank: number;
  temperature: number;
  humidity: number;
  pm25: number;
  pm10: number;
  aqi: number;
}

interface ParkingRow {
  id: string;
  name: string;
  status: SensorStatus;
  statusRank: number;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  occupancy: number;
}

interface EnergyRow {
  id: string;
  name: string;
  status: SensorStatus;
  statusRank: number;
  consumption: number;
  kind: EnergyData['type'];
}

interface LightRow {
  id: string;
  name: string;
  status: SensorStatus;
  statusRank: number;
  light: TrafficLightData['status'];
  nextChangeIn: number;
}

const STATUS_RANK: Record<SensorStatus, number> = { critical: 2, warning: 1, normal: 0 };
const CONGESTION_RANK: Record<TrafficData['congestionLevel'], number> = { high: 2, medium: 1, low: 0 };
const CONGESTION_LABEL: Record<TrafficData['congestionLevel'], string> = {
  high: 'Velika',
  medium: 'Umjerena',
  low: 'Mala',
};

export const SensorList = () => {
  const cityData = useCityStore((state) => state.cityData);

  const tables = useMemo(() => {
    if (!cityData) return null;
    const byType = (type: SensorType) => cityData.locations.filter((location) => location.type === type);

    const traffic: TrafficRow[] = byType('traffic').map((location) => {
      const data = cityData.traffic.find((item) => item.sensorId === location.id);
      const congestion = data?.congestionLevel ?? 'low';
      const status = getStatus(location, cityData);
      return {
        id: location.id,
        name: location.name,
        status,
        statusRank: STATUS_RANK[status],
        vehicleCount: data?.vehicleCount ?? 0,
        averageSpeed: data?.averageSpeed ?? 0,
        congestion,
        congestionRank: CONGESTION_RANK[congestion],
      };
    });

    const environment: EnvironmentRow[] = byType('environment').map((location) => {
      const data = cityData.environment.find((item) => item.sensorId === location.id);
      const status = getStatus(location, cityData);
      return {
        id: location.id,
        name: location.name,
        status,
        statusRank: STATUS_RANK[status],
        temperature: data?.temperature ?? 0,
        humidity: data?.humidity ?? 0,
        pm25: data?.airQuality.pm25 ?? 0,
        pm10: data?.airQuality.pm10 ?? 0,
        aqi: data?.airQuality.aqi ?? 0,
      };
    });

    const parking: ParkingRow[] = byType('parking').map((location) => {
      const data = cityData.parking.find((item) => item.sensorId === location.id);
      const occupancy = data ? (data.occupiedSpaces / data.totalSpaces) * 100 : 0;
      const status = getStatus(location, cityData);
      return {
        id: location.id,
        name: location.name,
        status,
        statusRank: STATUS_RANK[status],
        totalSpaces: data?.totalSpaces ?? 0,
        occupiedSpaces: data?.occupiedSpaces ?? 0,
        availableSpaces: data?.availableSpaces ?? 0,
        occupancy,
      };
    });

    const energy: EnergyRow[] = byType('energy').map((location) => {
      const data = cityData.energy.find((item) => item.sensorId === location.id);
      const status = getStatus(location, cityData);
      return {
        id: location.id,
        name: location.name,
        status,
        statusRank: STATUS_RANK[status],
        consumption: data?.consumption ?? 0,
        kind: data?.type ?? 'building',
      };
    });

    const lights: LightRow[] = byType('traffic-light').map((location) => {
      const data = cityData.trafficLights.find((item) => item.sensorId === location.id);
      return {
        id: location.id,
        name: location.name,
        status: 'normal',
        statusRank: 0,
        light: data?.status ?? 'green',
        nextChangeIn: data?.nextChangeIn ?? 0,
      };
    });

    return { traffic, environment, parking, energy, lights };
  }, [cityData]);

  if (!cityData || !tables) {
    return (
      <div className="bg-gray-800 text-white p-6 rounded-xl border border-gray-700">
        <p className="text-yellow-400 text-sm">Čekanje na podatke sa servera…</p>
      </div>
    );
  }

  const counts = {
    critical: cityData.locations.filter((location) => getStatus(location, cityData) === 'critical').length,
    warning: cityData.locations.filter((location) => getStatus(location, cityData) === 'warning').length,
    normal: cityData.locations.filter((location) => getStatus(location, cityData) === 'normal').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Podaci i senzori</h2>
          <p className="text-sm text-gray-400 mt-1">Usporedba senzora istog tipa — iste mjerne jedinice, isti stupci.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-300">{counts.critical} kritično</span>
          <span className="px-2.5 py-1 rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-300">{counts.warning} upozorenje</span>
          <span className="px-2.5 py-1 rounded-lg bg-green-900/30 border border-green-800 text-green-300">{counts.normal} normalno</span>
        </div>
      </div>

      <ComparisonTable<TrafficRow>
        title="Promet"
        type="traffic"
        defaultSort="congestionRank"
        rows={tables.traffic}
        columns={[
          { key: 'name', label: 'Senzor', render: (row) => <span className="font-medium text-white">{row.name}</span> },
          { key: 'statusRank', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'vehicleCount', label: 'Vozila / h', align: 'right', render: (row) => <span className="text-white">{row.vehicleCount}</span> },
          { key: 'averageSpeed', label: 'Brzina km/h', align: 'right', render: (row) => <span className="text-white">{row.averageSpeed.toFixed(1)}</span> },
          {
            key: 'congestionRank',
            label: 'Gužva',
            render: (row) => (
              <div className="flex items-center gap-2">
                <Meter
                  value={row.congestionRank}
                  max={2}
                  color={row.congestion === 'high' ? 'bg-red-500' : row.congestion === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}
                />
                <span className={row.congestion === 'high' ? 'text-red-300' : row.congestion === 'medium' ? 'text-yellow-300' : 'text-green-300'}>
                  {CONGESTION_LABEL[row.congestion]}
                </span>
              </div>
            ),
          },
        ]}
      />

      <ComparisonTable<EnvironmentRow>
        title="Okoliš"
        type="environment"
        defaultSort="aqi"
        rows={tables.environment}
        columns={[
          { key: 'name', label: 'Senzor', render: (row) => <span className="font-medium text-white">{row.name}</span> },
          { key: 'statusRank', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'aqi', label: 'AQI', align: 'right', render: (row) => (
            <div className="inline-flex items-center justify-end gap-2">
              <Meter value={row.aqi} max={150} color={row.aqi > 100 ? 'bg-red-500' : row.aqi > 50 ? 'bg-yellow-500' : 'bg-green-500'} />
              <span className="text-white w-8">{row.aqi.toFixed(0)}</span>
            </div>
          ) },
          { key: 'pm25', label: 'PM2.5', align: 'right', render: (row) => <span className="text-white">{row.pm25.toFixed(1)}</span> },
          { key: 'pm10', label: 'PM10', align: 'right', render: (row) => <span className="text-white">{row.pm10.toFixed(1)}</span> },
          { key: 'temperature', label: '°C', align: 'right', render: (row) => <span className="text-white">{row.temperature.toFixed(1)}</span> },
          { key: 'humidity', label: 'Vlaga %', align: 'right', render: (row) => <span className="text-white">{row.humidity.toFixed(0)}</span> },
        ]}
      />

      <ComparisonTable<ParkingRow>
        title="Parking"
        type="parking"
        defaultSort="occupancy"
        rows={tables.parking}
        columns={[
          { key: 'name', label: 'Senzor', render: (row) => <span className="font-medium text-white">{row.name}</span> },
          { key: 'statusRank', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'availableSpaces', label: 'Slobodno', align: 'right', render: (row) => <span className="text-white">{row.availableSpaces}</span> },
          { key: 'occupiedSpaces', label: 'Zauzeto', align: 'right', render: (row) => <span className="text-white">{row.occupiedSpaces}</span> },
          { key: 'totalSpaces', label: 'Ukupno', align: 'right', render: (row) => <span className="text-white">{row.totalSpaces}</span> },
          { key: 'occupancy', label: 'Popunjenost', render: (row) => (
            <div className="flex items-center gap-2 justify-end">
              <Meter value={row.occupancy} color={row.occupancy >= 90 ? 'bg-red-500' : row.occupancy >= 70 ? 'bg-yellow-500' : 'bg-green-500'} />
              <span className="text-white w-12 text-right tabular-nums">{row.occupancy.toFixed(0)}%</span>
            </div>
          ) },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ComparisonTable<EnergyRow>
          title="Energija"
          type="energy"
          defaultSort="consumption"
          rows={tables.energy}
          columns={[
            { key: 'name', label: 'Senzor', render: (row) => <span className="font-medium text-white">{row.name}</span> },
            { key: 'statusRank', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            { key: 'kind', label: 'Tip', render: (row) => (
              <span className="text-gray-300">{row.kind === 'street-light' ? 'Rasvjeta' : 'Zgrada'}</span>
            ) },
            { key: 'consumption', label: 'kWh', align: 'right', render: (row) => (
              <div className="inline-flex items-center justify-end gap-2">
                <Meter value={row.consumption} max={100} color={row.consumption > 80 ? 'bg-red-500' : row.consumption > 50 ? 'bg-yellow-500' : 'bg-purple-500'} />
                <span className="text-white w-12">{row.consumption.toFixed(1)}</span>
              </div>
            ) },
          ]}
        />

        <ComparisonTable<LightRow>
          title="Semafori"
          type="traffic-light"
          defaultSort="nextChangeIn"
          rows={tables.lights}
          columns={[
            { key: 'name', label: 'Senzor', render: (row) => <span className="font-medium text-white">{row.name}</span> },
            { key: 'light', label: 'Svjetlo', render: (row) => (
              <span className="inline-flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: row.light === 'red' ? '#ef4444' : row.light === 'yellow' ? '#f59e0b' : '#22c55e' }}
                />
                <span className="text-white">{row.light === 'red' ? 'Crveno' : row.light === 'yellow' ? 'Žuto' : 'Zeleno'}</span>
              </span>
            ) },
            { key: 'nextChangeIn', label: 'Promjena (s)', align: 'right', render: (row) => <span className="text-white">{row.nextChangeIn}</span> },
          ]}
        />
      </div>
    </div>
  );
};
