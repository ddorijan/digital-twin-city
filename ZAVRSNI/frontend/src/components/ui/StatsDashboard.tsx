import { useEffect, useState } from 'react';
import { useCityStore } from '../../store/cityStore';
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Wind, Zap, Car, ParkingSquare, Activity, History } from 'lucide-react';
import { fetchSensorHistory, type HistoryPoint } from '../../services/historyApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#f9fafb',
};
const LABEL_STYLE = { color: '#6b7280', fontSize: '11px' };

function SectionTitle({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 mb-3`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700 p-4 ${className}`}>
      {children}
    </div>
  );
}

function NoData() {
  return (
    <div className="flex-1 flex items-center justify-center h-40">
      <p className="text-gray-600 text-sm">Prikupljam podatke…</p>
    </div>
  );
}

// ── Sub-charts ────────────────────────────────────────────────────────────────

function MetricsOverTime() {
  const history = useCityStore((s) => s.metricsHistory);
  if (history.length < 2) return <NoData />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Vozila */}
      <Card>
        <SectionTitle icon={Car} title="Ukupno vozila – trend" color="text-red-400" />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gVehicles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
            <Area type="monotone" dataKey="totalVehicles" stroke="#ef4444" strokeWidth={2}
              fill="url(#gVehicles)" name="Vozila" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* AQI */}
      <Card>
        <SectionTitle icon={Wind} title="Kvaliteta zraka (AQI) – trend" color="text-green-400" />
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
            {/* AQI reference zones */}
            <Line type="monotone" dataKey="averageAirQuality" stroke="#22c55e" strokeWidth={2}
              dot={false} name="AQI" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Energija */}
      <Card>
        <SectionTitle icon={Zap} title="Potrošnja energije (kWh) – trend" color="text-purple-400" />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
            <Area type="monotone" dataKey="totalEnergyConsumption" stroke="#a855f7" strokeWidth={2}
              fill="url(#gEnergy)" name="kWh" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Parking */}
      <Card>
        <SectionTitle icon={ParkingSquare} title="Popunjenost parkinga (%) – trend" color="text-orange-400" />
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE}
              formatter={(v: number | undefined) => v !== undefined ? [`${v}%`, 'Popunjenost'] : ['', '']} />
            <Line type="monotone" dataKey="parkingOccupancy" stroke="#f97316" strokeWidth={2}
              dot={false} name="%" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function TrafficPerSensor() {
  const cityData = useCityStore((s) => s.cityData);
  if (!cityData || cityData.traffic.length === 0) return <NoData />;

  const data = cityData.traffic.map((t) => {
    const loc = cityData.locations.find((l) => l.id === t.sensorId);
    return {
      name: loc?.name ?? t.sensorId,
      'Vozila/h': t.vehicleCount,
      'Brzina km/h': parseFloat(t.averageSpeed.toFixed(1)),
    };
  });

  return (
    <Card>
      <SectionTitle icon={Car} title="Promet po senzorima" color="text-red-400" />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-20} textAnchor="end" />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
          <Bar dataKey="Vozila/h"    fill="#ef4444" radius={[4,4,0,0]} isAnimationActive={false} />
          <Bar dataKey="Brzina km/h" fill="#f97316" radius={[4,4,0,0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function CongestionPie() {
  const cityData = useCityStore((s) => s.cityData);
  if (!cityData || cityData.traffic.length === 0) return <NoData />;

  const counts = { low: 0, medium: 0, high: 0 };
  cityData.traffic.forEach((t) => counts[t.congestionLevel]++);

  const data = [
    { name: 'Mala',     value: counts.low,    color: '#22c55e' },
    { name: 'Umjerena', value: counts.medium, color: '#f59e0b' },
    { name: 'Velika',   value: counts.high,   color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <SectionTitle icon={TrendingUp} title="Raspodjela gužve" color="text-red-400" />
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
            dataKey="value" paddingAngle={3} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE}
            formatter={(value) => {
              const v = Number(value ?? 0);
              return [`${v} senzora`, ''];
            }} />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

function EnvironmentPerSensor() {
  const cityData = useCityStore((s) => s.cityData);
  if (!cityData || cityData.environment.length === 0) return <NoData />;

  const data = cityData.environment.map((e) => {
    const loc = cityData.locations.find((l) => l.id === e.sensorId);
    return {
      name:     loc?.name ?? e.sensorId,
      'AQI':    parseFloat(e.airQuality.aqi.toFixed(1)),
      'PM2.5':  parseFloat(e.airQuality.pm25.toFixed(1)),
      'PM10':   parseFloat(e.airQuality.pm10.toFixed(1)),
      'Temp °C': parseFloat(e.temperature.toFixed(1)),
      'Vlaga %': parseFloat(e.humidity.toFixed(0)),
    };
  });

  return (
    <>
      <Card>
        <SectionTitle icon={Wind} title="Zagađenje po senzorima (AQI, PM2.5, PM10)" color="text-green-400" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-20} textAnchor="end" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
            <Bar dataKey="AQI"   fill="#22c55e" radius={[4,4,0,0]} isAnimationActive={false} />
            <Bar dataKey="PM2.5" fill="#86efac" radius={[4,4,0,0]} isAnimationActive={false} />
            <Bar dataKey="PM10"  fill="#4ade80" radius={[4,4,0,0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle icon={Activity} title="Temperatura i vlaga po senzorima" color="text-cyan-400" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-20} textAnchor="end" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
            <Bar dataKey="Temp °C" fill="#06b6d4" radius={[4,4,0,0]} isAnimationActive={false} />
            <Bar dataKey="Vlaga %"  fill="#0ea5e9" radius={[4,4,0,0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}

function ParkingPerSensor() {
  const cityData = useCityStore((s) => s.cityData);
  if (!cityData || cityData.parking.length === 0) return <NoData />;

  const data = cityData.parking.map((p) => {
    const loc = cityData.locations.find((l) => l.id === p.sensorId);
    const pct = parseFloat(((p.occupiedSpaces / p.totalSpaces) * 100).toFixed(1));
    return {
      name:       loc?.name ?? p.sensorId,
      Zauzeto:    p.occupiedSpaces,
      Slobodno:   p.availableSpaces,
      'Popunjenost %': pct,
    };
  });

  const radialData = data.map((d) => ({
    name: d.name,
    value: d['Popunjenost %'],
    fill: d['Popunjenost %'] >= 90 ? '#ef4444' : d['Popunjenost %'] >= 70 ? '#f59e0b' : '#22c55e',
  }));

  return (
    <>
      <Card>
        <SectionTitle icon={ParkingSquare} title="Parking – zauzeto vs slobodno" color="text-orange-400" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={58} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
            <Bar dataKey="Zauzeto"  fill="#ef4444" stackId="a" isAnimationActive={false} />
            <Bar dataKey="Slobodno" fill="#22c55e" stackId="a" radius={[0,4,4,0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle icon={Activity} title="Popunjenost parkinga (%)" color="text-orange-400" />
        <ResponsiveContainer width="100%" height={220}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%"
            data={radialData} startAngle={180} endAngle={0}>
            <RadialBar dataKey="value" label={{ position: 'insideStart', fill: '#9ca3af', fontSize: 10 }}
              isAnimationActive={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={(value) => {
                const v = Number(value ?? 0);
                return [`${v}%`, 'Popunjenost'];
              }} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}

function EnergyPerSensor() {
  const cityData = useCityStore((s) => s.cityData);
  if (!cityData || cityData.energy.length === 0) return <NoData />;

  const data = cityData.energy.map((e) => {
    const loc = cityData.locations.find((l) => l.id === e.sensorId);
    return {
      name: loc?.name ?? e.sensorId,
      'kWh': parseFloat(e.consumption.toFixed(1)),
      tip: e.type === 'street-light' ? 'Rasvjeta' : 'Zgrada',
    };
  });

  const byType = [
    { name: 'Javna rasvjeta', value: data.filter((d) => d.tip === 'Rasvjeta').reduce((s, d) => s + d['kWh'], 0), color: '#a855f7' },
    { name: 'Zgrade',         value: data.filter((d) => d.tip === 'Zgrada').reduce((s, d) => s + d['kWh'], 0),   color: '#7c3aed' },
  ].filter((d) => d.value > 0);

  return (
    <>
      <Card>
        <SectionTitle icon={Zap} title="Potrošnja energije po senzoru (kWh)" color="text-purple-400" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-20} textAnchor="end" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" kWh" />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE}
              formatter={(value) => {
                const v = Number(value ?? 0);
                return [`${v} kWh`, 'Potrošnja'];
              }} />
            <Bar dataKey="kWh" radius={[4,4,0,0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.tip === 'Rasvjeta' ? '#a855f7' : '#7c3aed'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {byType.length > 1 && (
        <Card>
          <SectionTitle icon={Zap} title="Energija po tipu" color="text-purple-400" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byType} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={4} isAnimationActive={false}>
                {byType.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(value) => {
                  const v = Number(value ?? 0);
                  return [`${v.toFixed(1)} kWh`, ''];
                }} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  );
}

// ── Sensor history / time-travel ─────────────────────────────────────────────

const RANGE_OPTIONS = [
  { label: 'Zadnjih 24h', seconds: 24 * 3600 },
  { label: 'Zadnjih 7 dana', seconds: 7 * 24 * 3600 },
] as const;

function SensorHistoryExplorer() {
  const cityData = useCityStore((s) => s.cityData);
  const sensors = (cityData?.locations ?? []).filter((l) => l.type !== 'traffic-light');

  const [sensorId, setSensorId] = useState<string>('');
  const [rangeSeconds, setRangeSeconds] = useState<number>(RANGE_OPTIONS[0].seconds);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Default to the first available sensor once data arrives
  useEffect(() => {
    if (!sensorId && sensors.length > 0) setSensorId(sensors[0].id);
  }, [sensors, sensorId]);

  useEffect(() => {
    if (!sensorId) return;
    const sensor = sensors.find((s) => s.id === sensorId);
    if (!sensor) return;

    let cancelled = false;
    setLoading(true);
    const toSeconds = Math.floor(Date.now() / 1000);
    const fromSeconds = toSeconds - rangeSeconds;

    fetchSensorHistory(sensorId, sensor.type, fromSeconds, toSeconds).then((data) => {
      if (!cancelled) {
        setPoints(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorId, rangeSeconds]);

  const sensor = sensors.find((s) => s.id === sensorId);
  const unit = sensor?.type === 'traffic' ? 'vozila'
    : sensor?.type === 'environment' ? 'AQI'
    : sensor?.type === 'energy' ? 'kWh'
    : sensor?.type === 'parking' ? '%'
    : '';

  const chartData = points.map((p) => ({
    time: new Date(p.timestamp).toLocaleString('hr-HR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    value: p.value,
  }));

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle icon={History} title="Povijest senzora" color="text-blue-400" />
        <div className="flex items-center gap-2">
          <select
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {sensors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => setRangeSeconds(opt.seconds)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  rangeSeconds === opt.seconds
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                    : 'border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <NoData />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center h-40">
          <p className="text-gray-600 text-sm">Nema povijesnih podataka za odabrani period.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit={unit ? ` ${unit}` : ''} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2}
              dot={false} name={unit} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export const StatsDashboard = () => {
  const cityData = useCityStore((s) => s.cityData);

  if (!cityData) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Čekanje na podatke…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Trend grafovi */}
      <section>
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Trendovi metrika (real-time)
        </h1>
        <MetricsOverTime />
      </section>

      {/* Povijest / time-travel */}
      <section>
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          Povijest senzora
        </h1>
        <SensorHistoryExplorer />
      </section>

      {/* Promet */}
      <section>
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-red-400" />
          Promet
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrafficPerSensor />
          <CongestionPie />
        </div>
      </section>

      {/* Okoliš */}
      <section>
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-green-400" />
          Okoliš i kvaliteta zraka
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnvironmentPerSensor />
        </div>
      </section>

      {/* Parking */}
      <section>
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ParkingSquare className="w-5 h-5 text-orange-400" />
          Parking
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ParkingPerSensor />
        </div>
      </section>

      {/* Energija */}
      <section>
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Energija
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnergyPerSensor />
        </div>
      </section>
    </div>
  );
};
