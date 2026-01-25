import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCityStore } from '../../store/cityStore';

// Mapbox token - dodaj svoj token u frontend/.env file
// Besplatan token: https://account.mapbox.com/
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'DODAJ_TOKEN_OVDJE';

mapboxgl.accessToken = MAPBOX_TOKEN;

// Đakovo koordinate
const ĐAKOVO_CENTER = {
  lng: 18.4103,
  lat: 45.3089
};

export const RealMapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const cityData = useCityStore((state) => state.cityData);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check if token exists
    console.log('🗺️ Mapbox Token:', MAPBOX_TOKEN ? 'Postoji' : 'Nedostaje');
    
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'DODAJ_TOKEN_OVDJE') {
      setMapError('Mapbox token nije postavljen. Dodaj token u frontend/.env');
      console.error('❌ Token nije valjan');
      return;
    }

    console.log('🗺️ Inicijaliziram mapu...');

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Realistic street view
        center: [ĐAKOVO_CENTER.lng, ĐAKOVO_CENTER.lat],
        zoom: 16,
        pitch: 60, // 3D angle
        bearing: 0,
        antialias: true
      });

      console.log('✅ Mapa kreirana');

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Greška pri učitavanju mape. Provjeri token i internet konekciju.');
      });

      // Add 3D buildings layer when map loads
      map.current.on('load', () => {
        console.log('✅ Mapa učitana uspješno!');
        setMapLoaded(true);

      // Add 3D buildings layer
      const layers = map.current!.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
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
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.8
          }
        },
        labelLayerId
      );
      console.log('✅ 3D zgrade dodane');
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Greška pri inicijalizaciji mape.');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add sensor markers when data is available
  useEffect(() => {
    if (!map.current || !mapLoaded || !cityData) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.sensor-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add sensor markers
    cityData.locations.forEach((location) => {
      let color = '#3b82f6';
      if (location.type === 'traffic') color = '#ef4444';
      if (location.type === 'environment') color = '#10b981';
      if (location.type === 'parking') color = '#f59e0b';
      if (location.type === 'energy') color = '#8b5cf6';

      const el = document.createElement('div');
      el.className = 'sensor-marker';
      el.style.backgroundColor = color;
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 8px;">
          <strong>${location.name}</strong><br/>
          <span style="color: ${color}; font-size: 12px;">
            ${location.type.toUpperCase()}
          </span>
        </div>`
      );

      new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [mapLoaded, cityData]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="absolute inset-0" 
        style={{ minHeight: '500px' }}
      />
      
      {/* Error message */}
      {mapError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <h3 className="font-bold text-lg mb-2">⚠️ Greška</h3>
          <p className="text-sm">{mapError}</p>
          <p className="text-xs mt-3 opacity-80">
            Token: {MAPBOX_TOKEN === 'DODAJ_TOKEN_OVDJE' ? 'Nije postavljen' : 'Postavljen'}
          </p>
        </div>
      )}
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-bold text-gray-900 mb-2">📍 Centar Đakova</h3>
        <p className="text-sm text-gray-600">
          Stvarni prikaz s Mapbox kartama. Zelene površine, ulice i zgrade su stvarne.
        </p>
        {mapLoaded && (
          <p className="text-xs text-green-600 mt-2 font-semibold">
            ✓ Mapa učitana
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
        <div className="text-xs font-semibold text-gray-900 mb-2">Legenda senzora:</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-700">Promet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">Okoliš</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-700">Parking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-700">Energija</span>
          </div>
        </div>
      </div>
    </div>
  );
};
