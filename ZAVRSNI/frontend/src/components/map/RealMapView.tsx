import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCityStore } from '../../store/cityStore';
import { websocketService } from '../../services/websocket';
import { fetchActiveIncidents, createIncidentEvent, resolveIncidentEvent } from '../../services/eventsApi';
import {
  tickCars, getSmartLights, makeInitialCars, fetchAllRoutes, applyRoutes,
  fetchParkingRoute, applyParkingRoute, rebuildRoutesAvoidingIncidents, applyAvoidingRoutes,
  selectTrafficIncidentLocation, fetchIncidentDetour, applyIncidentDetour, getDetourDestination,
  nearbyRoadVias, clearAllIncidents, type SimCar, type TrafficIncident, type RouteInfo,
} from '../../services/carSimulation';
import type {
  SensorLocation,
  SensorStatus,
  CityData,
} from '../../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
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

function getMarkerStyle(type: SensorLocation['type']) {
  switch (type) {
    case 'parking':
      return { label: 'P', background: '#f97316', text: '#ffffff', shape: 'circle', name: 'Parking' };
    case 'traffic-light':
      return { label: 'T', background: '#06b6d4', text: '#ffffff', shape: 'square', name: 'Semafor' };
    case 'traffic':
      return { label: 'V', background: '#3b82f6', text: '#ffffff', shape: 'circle', name: 'Promet' };
    case 'environment':
      return { label: 'A', background: '#22c55e', text: '#ffffff', shape: 'circle', name: 'Okoliš' };
    case 'energy':
      return { label: 'E', background: '#a78bfa', text: '#ffffff', shape: 'circle', name: 'Energija' };
    default:
      return { label: 'S', background: '#64748b', text: '#ffffff', shape: 'circle', name: 'Senzor' };
  }
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

  // Car simulation refs (updated every animation frame – no React state)
  const carsRef           = useRef<SimCar[]>(makeInitialCars());
  const animRef           = useRef<number | null>(null);
  const lastTickRef       = useRef(Date.now());
  const cityDataRef       = useRef<CityData | null>(null);
  /** Set of car IDs currently being fetched a parking route for (avoid duplicate fetches). */
  const fetchingParkingRef = useRef<Set<string>>(new Set());
  const fetchingDetourRef = useRef<Set<string>>(new Set());
  const incidentsRef = useRef<TrafficIncident[]>([]);
  const originalRoutesRef = useRef<RouteInfo[]>([]);
  const activeRoutesRef = useRef<RouteInfo[]>([]);
  const reroutingRef = useRef(false);
  const pendingIncidentsRef = useRef<TrafficIncident[] | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routesReady, setRoutesReady] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState(isNightHour());
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [legendOpen, setLegendOpen] = useState(true);
  const [clockStr, setClockStr] = useState(() => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  });

  const cityData = useCityStore((state) => state.cityData);
  const activeFilters = useCityStore((state) => state.activeFilters);
  const addLiveFeedEntry = useCityStore((state) => state.addLiveFeedEntry);
  const removeLiveFeedEntry = useCityStore((state) => state.removeLiveFeedEntry);
  // Keep a ref so the animation loop always reads fresh data without re-subscribing
  cityDataRef.current = cityData;
  incidentsRef.current = incidents;

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
          // Zoom-scaled radius/intensity - with ~74 sensors now packed into a
          // small town, a flat 65px/1.5 blob overlapped almost everywhere and
          // made the whole map look "on fire" even with only local congestion.
          'heatmap-intensity':  ['interpolate', ['linear'], ['zoom'], 13, 0.5, 16, 0.9, 19, 1.3],
          'heatmap-radius':     ['interpolate', ['linear'], ['zoom'], 13, 12, 16, 22, 19, 35],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(0,0,0,0)',
            0.2, 'rgba(0,230,130,0.4)',
            0.5, 'rgba(255,200,0,0.55)',
            0.8, 'rgba(255,100,0,0.7)',
            1,   'rgba(220,0,0,0.85)',
          ],
          'heatmap-opacity': 0.65,
        },
      });

      // Canvas-rendered sensor layers remain anchored to their coordinates while zooming.
      map.current!.addSource('sensors', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.current!.addLayer({
        id: 'sensors-circle',
        type: 'circle',
        source: 'sensors',
        paint: {
          'circle-radius': 12,
          'circle-color': ['get', 'background'],
          'circle-stroke-color': ['get', 'border'],
          'circle-stroke-width': 3,
        },
      });
      map.current!.addLayer({
        id: 'sensors-label',
        type: 'symbol',
        source: 'sensors',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': ['get', 'text'] },
      });
      map.current!.on('click', 'sensors-circle', (event) => {
        const sensorId = event.features?.[0]?.properties?.id as string | undefined;
        if (sensorId) setSelectedLocationId((previous) => previous === sensorId ? null : sensorId);
      });
      map.current!.on('mouseenter', 'sensors-circle', () => { map.current!.getCanvas().style.cursor = 'pointer'; });
      map.current!.on('mouseleave', 'sensors-circle', () => { map.current!.getCanvas().style.cursor = ''; });

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

      map.current!.addSource('incident-detours', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.current!.addLayer({
        id: 'incident-detours-layer',
        type: 'line',
        source: 'incident-detours',
        paint: {
          'line-color': '#fb7185',
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });

      map.current!.addSource('traffic-incident', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.current!.addLayer({
        id: 'traffic-incident-pulse',
        type: 'circle',
        source: 'traffic-incident',
        paint: {
          'circle-radius': 42,
          'circle-color': '#ef4444',
          'circle-opacity': 0.18,
        },
      });
      map.current!.addLayer({
        id: 'traffic-incident-halo',
        type: 'circle',
        source: 'traffic-incident',
        paint: {
          'circle-radius': 26,
          'circle-color': '#dc2626',
          'circle-opacity': 0.55,
          'circle-stroke-color': '#fecaca',
          'circle-stroke-width': 4,
        },
      });
      map.current!.addLayer({
        id: 'traffic-incident-core',
        type: 'circle',
        source: 'traffic-incident',
        paint: {
          'circle-radius': 11,
          'circle-color': '#7f1d1d',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      map.current!.addLayer({
        id: 'traffic-incident-label',
        type: 'symbol',
        source: 'traffic-incident',
        layout: {
          'text-field': 'SUDAR',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-offset': [0, 2.4],
          'text-anchor': 'top',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#7f1d1d',
          'text-halo-width': 2,
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

    const smartLightIds = new Set(
      getSmartLights(cityData).filter((light) => light.extended).map((light) => light.sensorId),
    );
    const sensorFeatures: GeoJSON.Feature[] = cityData.locations
      .filter((location) => activeFilters.includes(location.type))
      .map((location) => {
        const markerStyle = getMarkerStyle(location.type);
        const extendedGreen = smartLightIds.has(location.id);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [location.lng, location.lat] },
          properties: {
            id: location.id,
            label: markerStyle.label,
            background: extendedGreen ? '#22c55e' : markerStyle.background,
            border: extendedGreen ? '#86efac' : location.type === 'traffic-light'
              ? ({ red: '#ef4444', yellow: '#facc15', green: '#22c55e' }[cityData.trafficLights.find((light) => light.sensorId === location.id)?.status ?? 'green'])
              : getStatusColor(getSensorStatus(location, cityData)),
            text: markerStyle.text,
          },
        };
      });
    const sensorsSource = map.current.getSource('sensors') as mapboxgl.GeoJSONSource | undefined;
    sensorsSource?.setData({ type: 'FeatureCollection', features: sensorFeatures });
  }, [mapLoaded, cityData, activeFilters]);

  // Keep every incident geographically fixed just like the sensor and vehicle layers.
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const incidentSource = map.current.getSource('traffic-incident') as mapboxgl.GeoJSONSource | undefined;
    incidentSource?.setData({
      type: 'FeatureCollection',
      features: incidents.map((incident) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [incident.lng, incident.lat] },
        properties: { id: incident.id },
      })),
    });
  }, [incidents, mapLoaded]);

  // Fetch real road routes once map is ready
  useEffect(() => {
    if (!mapLoaded) return;
    fetchAllRoutes(MAPBOX_TOKEN).then(routes => {
      originalRoutesRef.current = routes;
      activeRoutesRef.current = routes;
      carsRef.current = applyRoutes(carsRef.current, routes);
      setRoutesReady(true);
    }).catch(() => setRoutesReady(false));
  }, [mapLoaded]);

  // ── Car simulation animation loop ─────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      carsRef.current = tickCars(carsRef.current, cityDataRef.current, delta, incidentsRef.current);

      carsRef.current.forEach((car) => {
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
          ).then((routeInfo) => {
            carsRef.current = applyParkingRoute(carsRef.current, car.id, routeInfo);
          }).catch(() => {
            /* keep the car on its current road loop until a road route is available */
          }).finally(() => {
            fetchingParkingRef.current.delete(car.id);
          });
        }
        if (car.state !== 'seeking_parking' && fetchingParkingRef.current.has(car.id)) {
          fetchingParkingRef.current.delete(car.id);
        }

        if (
          car.state === 'rerouting' &&
          !car.detourRouteInfo &&
          !fetchingDetourRef.current.has(car.id) &&
          fetchingDetourRef.current.size < 8
        ) {
          const destination = getDetourDestination(
            car,
            incidentsRef.current,
            originalRoutesRef.current,
          );
          if (!destination) return;
          fetchingDetourRef.current.add(car.id);
          const vias = nearbyRoadVias(originalRoutesRef.current, incidentsRef.current, 5);
          fetchIncidentDetour(
            MAPBOX_TOKEN,
            car.lng, car.lat,
            destination.lng, destination.lat,
            vias,
            incidentsRef.current,
          ).then((routeInfo) => {
            if (!routeInfo) return;
            carsRef.current = applyIncidentDetour(carsRef.current, car.id, routeInfo);
          }).finally(() => {
            fetchingDetourRef.current.delete(car.id);
          });
        }
        if (car.state !== 'rerouting' && fetchingDetourRef.current.has(car.id)) {
          fetchingDetourRef.current.delete(car.id);
        }
      });

      if (map.current) {
        const carSrc = map.current.getSource('cars') as mapboxgl.GeoJSONSource | undefined;
        if (carSrc) {
          const trafficReadings = cityDataRef.current?.traffic ?? [];
          const congestedFrac = trafficReadings.length > 0
            ? trafficReadings.filter((t) => t.congestionLevel !== 'low').length / trafficReadings.length
            : 0.3;
          const activeCount = Math.round(55 + congestedFrac * 40);

          const features: GeoJSON.Feature[] = carsRef.current
            .slice(0, activeCount)
            .filter((c) => c.routeInfo && c.state !== 'parked')
            .map((c) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
              properties: {
                id: c.id,
                carType: c.type,
                color: c.state === 'seeking_parking' ? '#f97316' : c.color,
                bearing: c.bearing,
              },
            }));
          carSrc.setData({ type: 'FeatureCollection', features });
        }

        const detourSource = map.current.getSource('incident-detours') as mapboxgl.GeoJSONSource | undefined;
        detourSource?.setData({
          type: 'FeatureCollection',
          features: carsRef.current
            .filter((car) => car.detourRouteInfo)
            .map((car) => ({
              type: 'Feature' as const,
              geometry: { type: 'LineString' as const, coordinates: car.detourRouteInfo!.coords },
              properties: {},
            })),
        });

        const routeSrc = map.current.getSource('car-parking-route') as mapboxgl.GeoJSONSource | undefined;
        if (routeSrc) {
          const seeker = carsRef.current.find((c) => c.state === 'seeking_parking' && c.parkingRouteInfo);
          routeSrc.setData({
            type: 'FeatureCollection',
            features: seeker?.parkingRouteInfo ? [{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: seeker.parkingRouteInfo.coords,
              },
              properties: {},
            }] : [],
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

  const applyRoadRoutes = async (nextIncidents: TrafficIncident[]) => {
    pendingIncidentsRef.current = nextIncidents;
    if (reroutingRef.current) return;
    reroutingRef.current = true;
    try {
      while (pendingIncidentsRef.current) {
        const requested = pendingIncidentsRef.current;
        pendingIncidentsRef.current = null;
        const baseRoutes = originalRoutesRef.current;
        const routes = requested.length === 0
          ? (baseRoutes.length > 0 ? baseRoutes : await fetchAllRoutes(MAPBOX_TOKEN))
          : await rebuildRoutesAvoidingIncidents(MAPBOX_TOKEN, requested, baseRoutes);
        originalRoutesRef.current = baseRoutes.length > 0 ? baseRoutes : routes;
        activeRoutesRef.current = routes;
        carsRef.current = applyAvoidingRoutes(carsRef.current, routes, requested);
      }
    } finally {
      reroutingRef.current = false;
    }
  };

  const simulateIncident = async () => {
    const location = selectTrafficIncidentLocation(carsRef.current, incidentsRef.current);
    if (!location) return;
    // Only ask the backend to create it - every connected tab (including this
    // one) picks it up from the 'city-event' broadcast below, so there is one
    // shared incident state instead of a per-browser-tab illusion of one.
    await createIncidentEvent(location.lat, location.lng);
  };

  const clearIncident = async () => {
    const active = incidentsRef.current;
    await Promise.all(active.map((incident) => resolveIncidentEvent(Number(incident.id))));
    // Local state clears once the matching 'resolved' broadcasts arrive.
  };

  // Hydrate incidents already active on the backend when this tab (re)connects,
  // so a freshly opened tab sees crashes that were simulated before it loaded.
  useEffect(() => {
    if (!routesReady) return;
    let cancelled = false;
    fetchActiveIncidents().then((events) => {
      if (cancelled || events.length === 0) return;
      const hydrated: TrafficIncident[] = events.map((e) => ({ id: String(e.id), lat: e.lat, lng: e.lng }));
      setIncidents(hydrated);
      void applyRoadRoutes(hydrated);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesReady]);

  // Single source of truth for incident state: every create/resolve flows
  // through this socket broadcast, whether triggered by this tab or another.
  useEffect(() => {
    const unsubscribe = websocketService.onCityEvent((payload) => {
      if (payload.action === 'created' && payload.event?.event_type === 'accident' && payload.event.status === 'active') {
        const { id, lat, lng } = payload.event;
        const incident: TrafficIncident = { id: String(id), lat, lng };
        setIncidents((prev) => {
          if (prev.some((i) => i.id === incident.id)) return prev;
          const next = [...prev, incident];
          void applyRoadRoutes(next);
          return next;
        });
        addLiveFeedEntry({
          id: `incident-${incident.id}`,
          timestamp: Date.now(),
          sensorId: incident.id,
          sensorName: 'Prometni sudar',
          type: 'incident',
          status: 'critical',
          message: `Sudar na cesti — vozila se preusmjeravaju (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        });
      } else if (payload.action === 'resolved' && payload.id !== undefined) {
        const resolvedId = String(payload.id);
        fetchingDetourRef.current.clear();
        setIncidents((prev) => {
          if (!prev.some((i) => i.id === resolvedId)) return prev;
          const next = prev.filter((i) => i.id !== resolvedId);
          if (next.length === 0) {
            carsRef.current = clearAllIncidents(carsRef.current);
          }
          void applyRoadRoutes(next);
          return next;
        });
        // Drop the pinned "critical" entry for this incident - otherwise it stays
        // stuck at the top of the feed forever even after being resolved.
        removeLiveFeedEntry(`incident-${resolvedId}`);
        addLiveFeedEntry({
          id: `incident-clear-${Date.now()}`,
          timestamp: Date.now(),
          sensorId: 'incident-clear',
          sensorName: 'Prometni sudar',
          type: 'incident',
          status: 'normal',
          message: 'Sudar uklonjen — vozila se vraćaju na originalne cestovne rute.',
        });
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLiveFeedEntry]);

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
      {/* Status legend (foldable) */}
      <div className="absolute bottom-4 left-4 z-20 bg-gray-900/90 backdrop-blur-sm text-white rounded-lg border border-gray-700 shadow max-w-[220px]">
        <button
          type="button"
          onClick={() => setLegendOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-800/60 rounded-lg transition-colors"
        >
          <span className="text-xs font-semibold text-gray-300">Legenda</span>
          {legendOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </button>
        {legendOpen && (
          <div className="px-3 pb-2">
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
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <div className="w-4 h-0.5 flex-shrink-0 bg-rose-400" />
                <span>Nove cestovne rute</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0 bg-red-600 border-2 border-red-200" />
                <span>Sudar</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        {incidents.length > 0 && (
          <button
            onClick={clearIncident}
            className="bg-gray-900/90 backdrop-blur-sm text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-xs font-semibold shadow hover:bg-gray-800 transition-colors"
          >
            Ukloni sudar
          </button>
        )}
        <button
          onClick={simulateIncident}
          className="bg-red-600/95 backdrop-blur-sm text-white border border-red-300/50 rounded-lg px-3 py-2 text-xs font-bold shadow hover:bg-red-500 transition-colors"
        >
          Simuliraj sudar
        </button>
      </div>

      {incidents.length > 0 && (
        <div className="absolute top-16 left-4 z-20 bg-red-950/90 backdrop-blur-sm text-red-100 rounded-lg px-3 py-2 border border-red-500/60 shadow text-xs">
          {incidents.length} {incidents.length === 1 ? 'sudar aktivan' : 'sudara aktivno'} - vozila se preusmjeravaju.
        </div>
      )}

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




