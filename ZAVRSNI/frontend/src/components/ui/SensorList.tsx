import { useCityStore } from '../../store/cityStore';

export const SensorList = () => {
  const cityData = useCityStore((state) => state.cityData);

  if (!cityData) return null;

  const getSensorData = (sensorId: string) => {
    const traffic = cityData.traffic.find(t => t.sensorId === sensorId);
    const environment = cityData.environment.find(e => e.sensorId === sensorId);
    const parking = cityData.parking.find(p => p.sensorId === sensorId);
    const energy = cityData.energy.find(e => e.sensorId === sensorId);

    if (traffic) return `${traffic.vehicleCount} vozila, ${traffic.averageSpeed} km/h`;
    if (environment) return `${environment.temperature}°C, AQI ${environment.airQuality.aqi}`;
    if (parking) return `${parking.availableSpaces}/${parking.totalSpaces} slobodno`;
    if (energy) return `${energy.consumption} kWh`;
    return 'Nema podataka';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'traffic': 'Promet',
      'environment': 'Okoliš',
      'parking': 'Parking',
      'energy': 'Energija',
      'traffic-light': 'Semafor'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-900 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Senzori u Đakovu</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {cityData.locations.map((location) => (
          <div
            key={location.id}
            className="p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{location.name}</p>
                <p className="text-sm text-gray-400">{getTypeLabel(location.type)}</p>
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                {location.id}
              </span>
            </div>
            <p className="text-sm text-green-400 mt-2">
              {getSensorData(location.id)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
