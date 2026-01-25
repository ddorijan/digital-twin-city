import { useEffect, useState } from 'react';
import { CityScene } from './components/3d/CityScene';
import { RealMapView } from './components/map/RealMapView';
import { Dashboard } from './components/ui/Dashboard';
import { SensorList } from './components/ui/SensorList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCityStore } from './store/cityStore';
import { websocketService } from './services/websocket';
import { Wifi, WifiOff, Map, Box } from 'lucide-react';

function App() {
  const { isConnected, setConnected, updateCityData, cityData } = useCityStore();
  const [activeView, setActiveView] = useState<'map' | '3d' | 'data'>('data');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();
    setConnected(true);

    // Listen for data updates
    const unsubscribe = websocketService.onData((data) => {
      updateCityData(data);
      setIsLoading(false);
    });

    // Set timeout for loading
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
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
          <div className="flex items-center gap-4">
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
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveView('map')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeView === 'map'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Stvarna Mapa
          </button>
          <button
            onClick={() => setActiveView('3d')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeView === '3d'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            3D Simulacija
          </button>
          <button
            onClick={() => setActiveView('data')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeView === 'data'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Podaci i Senzori
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {/* Loading State */}
        {isLoading && !cityData ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Učitavanje podataka...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Dashboard />
            </div>

            {activeView === 'map' ? (
              <ErrorBoundary fallback={
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-red-400 mb-2">❌ Greška pri učitavanju mape</p>
                  <p className="text-sm text-gray-400">Provjeri Mapbox token u .env</p>
                </div>
              }>
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
                  <RealMapView />
                </div>
              </ErrorBoundary>
            ) : activeView === '3d' ? (
              <ErrorBoundary fallback={
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-red-400 mb-2">❌ WebGL ne radi</p>
                  <p className="text-sm text-gray-400">Tvoja grafička kartica ne podržava WebGL ili driveri trebaju update</p>
                </div>
              }>
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
                  <CityScene />
                </div>
              </ErrorBoundary>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <SensorList />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center text-sm text-gray-400 mt-8">
        <p>Digital Twin Đakovo - Studentski projekt 2026</p>
      </footer>
    </div>
  );
}

export default App;
