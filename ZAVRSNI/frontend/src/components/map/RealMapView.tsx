import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useCityStore } from '../../store/cityStore';
import {
  tickCars, getSmartLights, makeInitialCars, fetchAllRoutes, applyRoutes,
  fetchParkingRoute, applyParkingRoute,
  type SimCar,
} from '../../services/carSimulation';
import type {
  SensorLocation,
  SensorStatus,
  CityData,
} from '../../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '***REMOVED***';
mapboxgl.accessToken = MAPBOX_TOKEN;

const ĐAKOVO_CENTER = { lng: 18.4103, lat: 45.3089 };

// ── Status helpers ────────────────────────────────────────────────────────────

function getSensorStatus(location: SensorLocation, cityData: CityData): SensorStatus {
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

function getStatusColor(status: SensorStatus): string {
  if (status === 'critical') return '#ef4444';
  if (status === 'warning') return '#f59e0b';
  return '#22c55e';
}

function getSensorData(location: SensorLocation, cityData: CityData): unknown {
  switch (location.type) {
    case 'traffic':       return cityData.traffic.find((t) => t.sensorId === location.id) ?? null;
    case 'environment':   return cityData.environment.find((e) => e.sensorId === location.id) ?? null;
    case 'parking':       return cityData.parking.find((p) => p.sensorId === location.id) ?? null;
    case 'energy':        return cityData.energy.find((e) => e.sensorId === location.id) ?? null;
    case 'traffic-light': return cityData.trafficLights.find((t) => t.sensorId === location.id) ?? null;
    default:              return null;
  }
}

function isNightHour(): boolean {
  const h = new Date().getHours();
  return h >= 20 || h < 5;
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function SensorDetailPanel({
  location,
  data,
  status,
  onClose,
}: {
  location: SensorLocation;
  data: unknown;
  status: SensorStatus;
  onClose: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const statusColor =
    status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-yellow-400' : 'text-green-400';
  const statusLabel =
    status === 'critical' ? 'Kritično' : status === 'warning' ? 'Upozorenje' : 'Normalno';
  const StatusIcon =
    status === 'critical' ? XCircle : status === 'warning' ? AlertTriangle : CheckCircle;

  const typeLabels: Record<string, string> = {
    traffic: 'Promet',
    environment: 'Okoliš',
    parking: 'Parking',
    energy: 'Energija',
    'traffic-light': 'Semafor',
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-gray-700 w-[270px] select-none">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-700">
        <div className="min-w-0 pr-2">
          <h3 className="font-bold text-base leading-tight">{location.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{typeLabels[location.type] ?? location.type}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Zatvori panel senzora"
          className="flex-shrink-0 p-1 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status badge */}
        <div className={`flex items-center gap-2 ${statusColor}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-semibold">{statusLabel}</span>
        </div>

        {/* Type-specific data */}
        {location.type === 'traffic' && d && (
          <div className="space-y-1">
            <DataRow label="Vozila / sat" value={d.vehicleCount} />
            <DataRow label="Prosj. brzina" value={`${d.averageSpeed.toFixed(1)} km/h`} />
            <DataRow
              label="Razina gužve"
              value={d.congestionLevel === 'low' ? 'Mala' : d.congestionLevel === 'medium' ? 'Umjerena' : 'Velika'}
            />
          </div>
        )}

        {location.type === 'environment' && d && (
          <div className="space-y-1">
            <DataRow label="Temperatura" value={`${d.temperature.toFixed(1)} °C`} />
            <DataRow label="Vlažnost" value={`${d.humidity.toFixed(0)} %`} />
            <DataRow label="PM2.5" value={`${d.airQuality.pm25.toFixed(1)} µg/m³`} />
            <DataRow label="PM10" value={`${d.airQuality.pm10.toFixed(1)} µg/m³`} />
            <DataRow label="AQI" value={d.airQuality.aqi.toFixed(0)} />
          </div>
        )}

        {location.type === 'parking' && d && (
          <div className="space-y-2">
            <DataRow label="Ukupno mjesta" value={d.totalSpaces} />
            <DataRow label="Zauzeto" value={d.occupiedSpaces} />
            <DataRow label="Slobodno" value={d.availableSpaces} />
            <div>
              <div className="text-xs text-gray-400 mb-1">Popunjenost</div>
              <div className="bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(d.occupiedSpaces / d.totalSpaces) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {location.type === 'energy' && d && (
          <div className="space-y-1">
            <DataRow label="Potrošnja" value={`${d.consumption.toFixed(1)} kWh`} />
            <DataRow label="Tip" value={d.type === 'street-light' ? 'Javna rasvjeta' : 'Zgrada'} />
          </div>
        )}

        {location.type === 'traffic-light' && d && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full shadow-lg flex-shrink-0"
                style={{
                  backgroundColor:
                    d.status === 'red' ? '#ef4444' : d.status === 'yellow' ? '#f59e0b' : '#22c55e',
                }}
              />
              <span className="font-medium">
                {d.status === 'red' ? 'Crveno' : d.status === 'yellow' ? 'Žuto' : 'Zeleno'}
              </span>
            </div>
            <DataRow label="Promjena za" value={`${d.nextChangeIn} s`} />
          </div>
        )}

        <div className="pt-1 text-xs text-gray-600 border-t border-gray-800">
          {location.id} · {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const RealMapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Car simulation refs (updated every animation frame – no React state)
  const carsRef           = useRef<SimCar[]>(makeInitialCars());
  const animRef           = useRef<number | null>(null);
  const lastTickRef       = useRef(Date.now());
  const cityDataRef       = useRef<CityData | null>(null);
  /** Set of car IDs currently being fetched a parking route for (avoid duplicate fetches). */
  const fetchingParkingRef = useRef<Set<string>>(new Set());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routesReady, setRoutesReady] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState(isNightHour());
  const [clockStr, setClockStr] = useState(() => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  });

  const cityData = useCityStore((state) => state.cityData);
  const activeFilters = useCityStore((state) => state.activeFilters);
  // Keep a ref so the animation loop always reads fresh data without re-subscribing
  cityDataRef.current = cityData;

  // Derived selected-sensor data (auto-updates with cityData)
  const selectedLocation = cityData?.locations.find((l) => l.id === selectedLocationId) ?? null;
  const selectedData = selectedLocation && cityData ? getSensorData(selectedLocation, cityData) : null;
  const selectedStatus = selectedLocation && cityData ? getSensorStatus(selectedLocation, cityData) : 'normal';

  // Clock + night mode ticker
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClockStr(`${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`);
      setNightMode(isNightHour());
    };
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  // Initialize map (once)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'DODAJ_TOKEN_OVDJE') {
      setMapError('Mapbox token nije postavljen. Dodaj VITE_MAPBOX_TOKEN u frontend/.env');
      return;
    }

    const bounds: [number, number, number, number] = [18.38, 45.28, 18.44, 45.34];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [ĐAKOVO_CENTER.lng, ĐAKOVO_CENTER.lat],
      zoom: 16,
      minZoom: 13,
      maxZoom: 19,
      maxBounds: bounds,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.on('error', () => setMapError('Greška pri učitavanju mape. Provjeri token.'));

    map.current.on('load', () => {
      setMapLoaded(true);

      // 3D buildings
      const layers = map.current!.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && (layer.layout as Record<string, unknown>)?.['text-field']
      )?.id;

      map.current!.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#b0b8c1',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
            'fill-extrusion-base':   ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.8,
          },
        },
        labelLayerId,
      );

      // Heatmap source + layer
      map.current!.addSource('sensor-heatmap', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'sensor-heatmap',
        paint: {
          'heatmap-weight':     ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
          'heatmap-intensity':  1.5,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(0,0,0,0)',
            0.2, 'rgba(0,230,130,0.4)',
            0.5, 'rgba(255,200,0,0.55)',
            0.8, 'rgba(255,100,0,0.7)',
            1,   'rgba(220,0,0,0.85)',
          ],
          'heatmap-radius':  65,
          'heatmap-opacity': 0.65,
        },
      });

      // Parking-route guidance line
      map.current!.addSource('car-parking-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.current!.addLayer({
        id: 'car-parking-route-layer',
        type: 'line',
        source: 'car-parking-route',
        paint: {
          'line-color': '#f97316',
          'line-width': 2.5,
          'line-dasharray': [4, 3],
          'line-opacity': 0.9,
        },
      });

      // ── Cars: canvas-rendered GeoJSON so they stay fixed during zoom ──────
      map.current!.addSource('cars', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      // Coloured circle body
      map.current!.addLayer({
        id: 'cars-circle',
        type: 'circle',
        source: 'cars',
        paint: {
          'circle-radius': ['match', ['get', 'carType'], 'bus', 7, 5],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': 'rgba(255,255,255,0.9)',
          'circle-stroke-width': 1.5,
          'circle-opacity': 1,
        },
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers + heatmap when data / filters change
  useEffect(() => {
    if (!map.current || !mapLoaded || !cityData) return;

    // Update heatmap data
    const heatFeatures: GeoJSON.Feature[] = cityData.locations.map((loc) => {
      let weight = 0.1;
      if (loc.type === 'traffic') {
        const d = cityData.traffic.find((t) => t.sensorId === loc.id);
        if (d) weight = d.congestionLevel === 'high' ? 1 : d.congestionLevel === 'medium' ? 0.55 : 0.12;
      } else if (loc.type === 'environment') {
        const d = cityData.environment.find((e) => e.sensorId === loc.id);
        if (d) weight = Math.min(d.airQuality.aqi / 150, 1);
      } else if (loc.type === 'parking') {
        const d = cityData.parking.find((p) => p.sensorId === loc.id);
        if (d) weight = d.occupiedSpaces / d.totalSpaces;
      }
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] },
        properties: { weight },
      };
    });

    const heatSrc = map.current.getSource('sensor-heatmap') as mapboxgl.GeoJSONSource | undefined;
    heatSrc?.setData({ type: 'FeatureCollection', features: heatFeatures });

    // Determine visible sensor IDs
    const visibleIds = new Set(
      cityData.locations.filter((l) => activeFilters.includes(l.type)).map((l) => l.id),
    );

    // Remove hidden markers
    markersRef.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update visible markers
    cityData.locations.forEach((location) => {
      if (!activeFilters.includes(location.type)) return;

      const status = getSensorStatus(location, cityData);
      const color = getStatusColor(status);
      const existing = markersRef.current.get(location.id);

      if (existing) {
        const el = existing.getElement();
        el.style.backgroundColor = color;
        if (status === 'critical') el.classList.add('sensor-pulse');
        else el.classList.remove('sensor-pulse');
      } else {
        const el = document.createElement('div');
        el.className = 'sensor-marker' + (status === 'critical' ? ' sensor-pulse' : '');
        el.style.cssText = `
          background-color: ${color};
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: background-color 0.4s ease;
        `;

        const typeIcon: Record<string, string> = {
          traffic: '🚗', environment: '🌿', parking: '🅿️',
          energy: '⚡', 'traffic-light': '🚦',
        };
        el.title = `${location.name} (${typeIcon[location.type] ?? ''})`;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedLocationId((prev) => (prev === location.id ? null : location.id));
        });

        markersRef.current.set(
          location.id,
          new mapboxgl.Marker(el).setLngLat([location.lng, location.lat]).addTo(map.current!),
        );
      }
    });
  }, [mapLoaded, cityData, activeFilters]);

  // Fetch real road routes once map is ready
  useEffect(() => {
    if (!mapLoaded) return;
    fetchAllRoutes(MAPBOX_TOKEN).then(routes => {
      carsRef.current = applyRoutes(carsRef.current, routes);
      setRoutesReady(true);
    }).catch(() => setRoutesReady(false));
  }, [mapLoaded]);

  // ── Car simulation animation loop ─────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const animate = () => {
      const now   = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // Advance simulation
      carsRef.current = tickCars(carsRef.current, cityDataRef.current, delta);

      // Fetch road-following routes for cars that just started seeking parking
      carsRef.current.forEach(car => {
        if (
          car.state === 'seeking_parking' &&
          car.targetParking &&
          !car.parkingRouteInfo &&
          !fetchingParkingRef.current.has(car.id)
        ) {
          fetchingParkingRef.current.add(car.id);
          fetchParkingRoute(
            MAPBOX_TOKEN,
            car.lng, car.lat,
            car.targetParking.lng, car.targetParking.lat,
          ).then(routeInfo => {
            carsRef.current = applyParkingRoute(carsRef.current, car.id, routeInfo);
            fetchingParkingRef.current.delete(car.id);
          });
        }
        // Clean up fetching flag if car is no longer seeking parking
        if (car.state !== 'seeking_parking' && fetchingParkingRef.current.has(car.id)) {
          fetchingParkingRef.current.delete(car.id);
        }
      });
      if (map.current) {
        // ── Render cars as GeoJSON features (canvas-anchored, zoom-safe) ────
        const carSrc = map.current.getSource('cars') as mapboxgl.GeoJSONSource | undefined;
        if (carSrc) {
          // Car count is independent of sensor count.
          // Use fraction of congested sensors to scale between 15 and 40 cars.
          const trafficReadings = cityDataRef.current?.traffic ?? [];
          const congestedFrac = trafficReadings.length > 0
            ? trafficReadings.filter(t => t.congestionLevel !== 'low').length / trafficReadings.length
            : 0.3;
          const activeCount = Math.round(15 + congestedFrac * 25); // 15 (calm) → 40 (full congestion)

          const features: GeoJSON.Feature[] = carsRef.current
            .slice(0, activeCount)
            .filter(c => c.routeInfo && c.state !== 'parked')
            .map(c => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
              properties: {
                id:      c.id,
                carType: c.type,
                color:   c.state === 'seeking_parking' ? '#f97316' : c.color,
                bearing: c.bearing,
              },
            }));
          carSrc.setData({ type: 'FeatureCollection', features });
        }

        // ── Update parking route line ────────────────────────────────────────
        const routeSrc = map.current.getSource('car-parking-route') as mapboxgl.GeoJSONSource | undefined;
        if (routeSrc) {
          const seeker = carsRef.current.find(c => c.state === 'seeking_parking' && c.targetParking);
          routeSrc.setData({
            type: 'FeatureCollection',
            features: seeker ? [{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [seeker.lng, seeker.lat],
                  [seeker.targetParking!.lng, seeker.targetParking!.lat],
                ],
              },
              properties: {},
            }] : [],
          });
        }

        // ── Smart traffic lights ─────────────────────────────────────────────
        if (cityDataRef.current) {
          getSmartLights(cityDataRef.current).forEach(sl => {
            const marker = markersRef.current.get(sl.sensorId);
            if (!marker) return;
            const el = marker.getElement();
            if (sl.extended) {
              el.style.backgroundColor = '#22c55e';
              el.style.border = '3px solid #86efac';
              el.style.boxShadow = '0 0 0 6px rgba(34,197,94,0.35)';
              el.title = '🚦 Produženo zeleno – gužva u blizini';
            }
          });
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mapLoaded]);

  return (
    <div className="relative w-full h-full">
      {/* Map canvas */}
      <div ref={mapContainer} className="absolute inset-0 min-h-[500px]" />

      {/* Night overlay */}
      {nightMode && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ backgroundColor: 'rgba(5, 12, 35, 0.52)', transition: 'opacity 2s ease' }}
        />
      )}

      {/* Error */}
      {mapError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/90 backdrop-blur text-white rounded-xl shadow-lg p-6 max-w-sm text-center z-30">
          <p className="font-bold mb-1">⚠️ Greška mape</p>
          <p className="text-sm">{mapError}</p>
        </div>
      )}

      {/* Day / Night clock badge */}
      <div className="absolute top-4 left-4 z-20 bg-gray-900/90 backdrop-blur-sm text-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm border border-gray-700 shadow">
        <span>{nightMode ? '🌙' : '☀️'}</span>
        <span className="font-mono font-bold">{clockStr}</span>
        <span className="text-gray-400 text-xs">{nightMode ? 'Noć' : 'Dan'}</span>
      </div>

      {/* Route loading indicator */}
      {mapLoaded && !routesReady && (
        <div className="absolute top-16 left-4 z-20 bg-gray-900/90 backdrop-blur-sm text-yellow-400 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs border border-yellow-700/50 shadow">
          <span className="animate-spin">⏳</span>
          <span>Učitavanje ruta vozila…</span>
        </div>
      )}

      {/* Status legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-gray-900/90 backdrop-blur-sm text-white rounded-lg px-3 py-2 border border-gray-700 shadow">
        <p className="text-xs font-semibold text-gray-300 mb-1.5">Status senzora</p>
        {([['#22c55e', 'Normalno'], ['#f59e0b', 'Upozorenje'], ['#ef4444', 'Kritično']] as const).map(
          ([c, l]) => (
            <div key={l} className="flex items-center gap-2 text-xs text-gray-300 mb-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
              <span>{l}</span>
            </div>
          ),
        )}
        <div className="border-t border-gray-700 mt-1.5 pt-1.5">
          <p className="text-xs font-semibold text-gray-400 mb-1">Promet</p>
          {([['#3b82f6','Osobni auto'],['#fbbf24','Taxi'],['#a78bfa','Bus']] as const).map(([c,l]) => (
            <div key={l} className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
              <div className="w-4 h-2 rounded-sm flex-shrink-0 border border-white/40" style={{ backgroundColor: c }} />
              <span>{l}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <div className="w-4 h-0.5 flex-shrink-0" style={{ background: 'repeating-linear-gradient(90deg,#f97316 0,#f97316 4px,transparent 4px,transparent 7px)' }} />
            <span>Ruta do parkinga</span>
          </div>
        </div>
      </div>

      {/* Sensor detail panel */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 z-20">
          <SensorDetailPanel
            location={selectedLocation}
            data={selectedData}
            status={selectedStatus}
            onClose={() => setSelectedLocationId(null)}
          />
        </div>
      )}
    </div>
  );
};




