import { useCityStore } from '../../store/cityStore';
import { Activity, Wind, Zap, Car } from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type MetricKey = 'totalVehicles' | 'averageAirQuality' | 'totalEnergyConsumption' | 'parkingOccupancy';

interface CardDef {
  title: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  chartColor: string;
  dataKey: MetricKey;
  getValue: (v: number) => string | number;
}

const CARDS: CardDef[] = [
  {
    title: 'Ukupno Vozila',
    unit: 'voz/h',
    icon: Car,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    chartColor: '#ef4444',
    dataKey: 'totalVehicles',
    getValue: (v) => v,
  },
  {
    title: 'Kvaliteta Zraka',
    unit: 'AQI',
    icon: Wind,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    chartColor: '#22c55e',
    dataKey: 'averageAirQuality',
    getValue: (v) => v,
  },
  {
    title: 'Potrošnja Energije',
    unit: 'kWh',
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    chartColor: '#a855f7',
    dataKey: 'totalEnergyConsumption',
    getValue: (v) => v.toFixed(1),
  },
  {
    title: 'Popunjenost Parkinga',
    unit: '%',
    icon: Activity,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    chartColor: '#f97316',
    dataKey: 'parkingOccupancy',
    getValue: (v) => v,
  },
];

export const Dashboard = () => {
  const cityData       = useCityStore((state) => state.cityData);
  const metricsHistory = useCityStore((state) => state.metricsHistory);

  if (!cityData) {
    return (
      <div className="bg-gray-800 text-white p-5 rounded-lg border border-gray-700">
        <p className="text-yellow-400 text-sm">⏳ Čekanje na podatke sa servera...</p>
        <p className="text-xs text-gray-500 mt-1">WebSocket se povezuje…</p>
      </div>
    );
  }

  const { metrics } = cityData;
  const currentValues: Record<MetricKey, number> = {
    totalVehicles:          metrics.totalVehicles,
    averageAirQuality:      metrics.averageAirQuality,
    totalEnergyConsumption: metrics.totalEnergyConsumption,
    parkingOccupancy:       metrics.parkingOccupancy,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const raw = currentValues[card.dataKey];
        return (
          <div
            key={card.dataKey}
            className={`${card.bgColor} rounded-xl p-4 shadow-lg border border-gray-700 flex flex-col gap-2`}
          >
            {/* Top row: label + icon */}
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-xs font-medium">{card.title}</p>
              <card.icon className={`w-5 h-5 ${card.color} opacity-70`} />
            </div>

            {/* Value */}
            <p className={`text-3xl font-bold ${card.color} leading-none`}>
              {card.getValue(raw)}
              <span className="text-sm font-normal text-gray-500 ml-1">{card.unit}</span>
            </p>

            {/* Sparkline */}
            {metricsHistory.length > 1 ? (
              <div className="h-10 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${card.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.chartColor} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={card.chartColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey={card.dataKey}
                      stroke={card.chartColor}
                      strokeWidth={2}
                      fill={`url(#grad-${card.dataKey})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        fontSize: '11px',
                        padding: '4px 8px',
                      }}
                      labelStyle={{ color: '#6b7280', fontSize: '10px' }}
                      formatter={(val: number | undefined) => val !== undefined ? [`${card.getValue(val)} ${card.unit}`, card.title] : ['', card.title]}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-10 flex items-center">
                <span className="text-xs text-gray-600">Prikupljam podatke…</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

