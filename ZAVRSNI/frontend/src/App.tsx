import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { RealMapView } from './components/map/RealMapView';
import { Dashboard } from './components/ui/Dashboard';
import { SensorList } from './components/ui/SensorList';
import { StatsDashboard } from './components/ui/StatsDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCityStore, ALL_SENSOR_TYPES } from './store/cityStore';
import { useAdminStore } from './store/adminStore';
import { websocketService } from './services/websocket';
import type { SensorType, LiveFeedEntry } from './types';
import { Wifi, WifiOff, Map, Shield, Car, Wind, Zap, ParkingSquare, TrafficCone, AlertTriangle, XCircle, CheckCircle, BarChart2 } from 'lucide-react';

// ── Filter bar ────────────────────────────────────────────────────────────────

const TYPE_META: Record<SensorType, { label: string; icon: React.ElementType; color: string; active: string }> = {
  traffic:       { label: 'Promet',   icon: Car,           color: 'border-red-500/50 text-red-400',    active: 'bg-red-500/20 border-red-400 text-red-300' },
  environment:   { label: 'Okoliš',   icon: Wind,          color: 'border-green-500/50 text-green-400', active: 'bg-green-500/20 border-green-400 text-green-300' },
  energy:        { label: 'Energija', icon: Zap,           color: 'border-purple-500/50 text-purple-400', active: 'bg-purple-500/20 border-purple-400 text-purple-300' },
  parking:       { label: 'Parking',  icon: ParkingSquare, color: 'border-orange-500/50 text-orange-400', active: 'bg-orange-500/20 border-orange-400 text-orange-300' },
  'traffic-light': { label: 'Semafori', icon: TrafficCone, color: 'border-yellow-500/50 text-yellow-400', active: 'bg-yellow-500/20 border-yellow-400 text-yellow-300' },
};

function FilterBar() {
  const activeFilters = useCityStore((state) => state.activeFilters);
  const toggleFilter  = useCityStore((state) => state.toggleFilter);

  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <span className="text-xs text-gray-500 font-medium mr-1">Prikaži senzore:</span>
      {ALL_SENSOR_TYPES.map((type) => {
        const meta   = TYPE_META[type];
        const active = activeFilters.includes(type);
        const Icon   = meta.icon;
        return (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all select-none ${
              active ? meta.active : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-400'
            }`}
          >
            <Icon className="w-3 h-3" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Live feed sidebar ─────────────────────────────────────────────────────────

function FeedEntry({ entry }: { entry: LiveFeedEntry }) {
  const Icon   = entry.status === 'critical' ? XCircle : entry.status === 'warning' ? AlertTriangle : CheckCircle;
  const color  = entry.status === 'critical' ? 'text-red-400' : entry.status === 'warning' ? 'text-yellow-400' : 'text-green-400';
  const border = entry.status === 'critical' ? 'border-red-800' : entry.status === 'warning' ? 'border-yellow-800' : 'border-green-800';

  const typeIcon: Record<string, string> = {
    traffic: '🚗', environment: '🌿', parking: '🅿️', energy: '⚡', 'traffic-light': '🚦',
  };
  const ts = new Date(entry.timestamp);
  const timeStr = `${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}:${ts.getSeconds().toString().padStart(2, '0')}`;

  return (
    <div className={`border-l-2 ${border} pl-2 py-1`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3 h-3 flex-shrink-0 ${color}`} />
        <span className="text-xs font-semibold text-gray-200 truncate">{entry.sensorName}</span>
        <span className="text-xs ml-auto text-gray-500 flex-shrink-0">{typeIcon[entry.type]}</span>
      </div>
      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{entry.message}</p>
      <p className="text-xs text-gray-600 mt-0.5 font-mono">{timeStr}</p>
    </div>
  );
}

function LiveFeedSidebar() {
  const liveFeed   = useCityStore((state) => state.liveFeed);
  const cityData   = useCityStore((state) => state.cityData);

  const criticalCount = liveFeed.filter((e) => e.status === 'critical').length;
  const warningCount  = liveFeed.filter((e) => e.status === 'warning').length;

  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
      {/* Mini stats */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Mini statistika</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-900/20 rounded-lg p-2 border border-red-900/40">
            <p className="text-red-400 text-lg font-bold">{criticalCount}</p>
            <p className="text-xs text-gray-500">Kritično</p>
          </div>
          <div className="bg-yellow-900/20 rounded-lg p-2 border border-yellow-900/40">
            <p className="text-yellow-400 text-lg font-bold">{warningCount}</p>
            <p className="text-xs text-gray-500">Upozorenja</p>
          </div>
          <div className="bg-gray-700/40 rounded-lg p-2 border border-gray-700 col-span-2">
            <p className="text-blue-400 text-lg font-bold">{cityData?.locations.length ?? 0}</p>
            <p className="text-xs text-gray-500">Aktivnih senzora</p>
          </div>
        </div>
      </div>

      {/* Live feed */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Live Feed</p>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Uživo" />
        </div>
        {liveFeed.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-600 text-center">Nema upozorenja.<br />Svi senzori normalni.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-2 pr-0.5 scrollbar-thin">
            {liveFeed.map((entry) => (
              <FeedEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const { isConnected, setConnected, updateCityData, cityData } = useCityStore();
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    websocketService.connect();
    setConnected(true);

    const unsubscribe = websocketService.onData((data) => {
      updateCityData(data);
      setIsLoading(false);
    });

    const timeout = setTimeout(() => setIsLoading(false), 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
      websocketService.disconnect();
      setConnected(false);
    };
  }, [setConnected, updateCityData]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Digital Twin Đakovo</h1>
            <p className="text-sm text-gray-400">Simulacija grada u stvarnom vremenu</p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400">Povezano</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-400">Nije povezano</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-4">
          <Link
            to="/"
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              location.pathname === '/'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Stvarna Mapa
          </Link>
          <Link
            to="/data"
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              location.pathname === '/data'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Podaci i Senzori
          </Link>
          <Link
            to="/stats"
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              location.pathname === '/stats'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Statistika
          </Link>
          <Link
            to="/admin"
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              location.pathname === '/admin'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className={location.pathname === '/admin' ? '' : 'p-6'}>
        <Routes>
          {/* Admin Route */}
          <Route
            path="/admin"
            element={isAuthenticated ? <AdminDashboard /> : <AdminLogin />}
          />

          {/* Sensor list */}
          <Route path="/data" element={<SensorList />} />

          {/* Statistics */}
          <Route path="/stats" element={<StatsDashboard />} />

          {/* Main map route */}
          <Route
            path="/"
            element={
              isLoading && !cityData ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4" />
                    <p className="text-gray-400">Učitavanje podataka…</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Dashboard metric cards */}
                  <div className="mb-4">
                    <Dashboard />
                  </div>

                  {/* Sensor type filter */}
                  <FilterBar />

                  {/* Map + Sidebar */}
                  <div className="flex gap-4 h-[620px]">
                    <ErrorBoundary
                      fallback={
                        <div className="flex-1 bg-gray-800 rounded-xl p-8 text-center flex flex-col items-center justify-center border border-gray-700">
                          <p className="text-red-400 mb-2">❌ Greška pri učitavanju mape</p>
                          <p className="text-sm text-gray-400">Provjeri Mapbox token u .env fajlu</p>
                        </div>
                      }
                    >
                      <div className="flex-1 bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 min-w-0">
                        <RealMapView />
                      </div>
                    </ErrorBoundary>

                    <LiveFeedSidebar />
                  </div>
                </>
              )
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      {location.pathname !== '/admin' && (
        <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center text-sm text-gray-500 mt-8">
          Digital Twin Đakovo
        </footer>
      )}
    </div>
  );
}

export default App;
