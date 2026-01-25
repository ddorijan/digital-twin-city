import { useCityStore } from '../../store/cityStore';
import { Activity, Wind, Zap, Car } from 'lucide-react';

export const Dashboard = () => {
  const cityData = useCityStore((state) => state.cityData);

  if (!cityData) {
    return (
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
        <p className="text-yellow-400">⏳ Čekanje na podatke sa servera...</p>
        <p className="text-xs text-gray-400 mt-2">WebSocket se povezuje...</p>
      </div>
    );
  }

  const { metrics } = cityData;

  const cards = [
    {
      title: 'Ukupno Vozila',
      value: metrics.totalVehicles,
      icon: Car,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
    },
    {
      title: 'Kvaliteta Zraka (AQI)',
      value: metrics.averageAirQuality,
      icon: Wind,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
    },
    {
      title: 'Potrošnja Energije (kWh)',
      value: metrics.totalEnergyConsumption.toFixed(1),
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
    },
    {
      title: 'Popunjenost Parkinga (%)',
      value: metrics.parkingOccupancy,
      icon: Activity,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg p-6 shadow-lg border border-gray-700`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">{card.title}</p>
              <p className={`text-3xl font-bold mt-2 ${card.color}`}>
                {card.value}
              </p>
            </div>
            <card.icon className={`w-12 h-12 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
};
