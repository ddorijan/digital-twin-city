import type {
  TrafficData,
  EnvironmentData,
  EnergyData,
  ParkingData,
  TrafficLightData,
  CityMetrics
} from '../../types/index.js';
import { getSensorLocations } from './locations.js';

// Helper function to generate random value within range
const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Đakovo city centre (Cathedral / main square)
const CENTRE_LAT = 45.3089;
const CENTRE_LNG = 18.4107;
// Maximum radius considered part of the city (~2 km in lat-degree equivalent)
const MAX_RADIUS = 0.022;

// Simulate traffic data
export const generateTrafficData = (): TrafficData[] => {
  const sensorLocations = getSensorLocations(); // Load fresh data
  const trafficSensors = sensorLocations.filter(s => s.type === 'traffic');
  
  return trafficSensors.map(sensor => {
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    
    // centreFactor: 1.0 = at city centre, 0.0 = at city edge or beyond
    const distDeg = Math.sqrt(
      Math.pow(sensor.lat - CENTRE_LAT, 2) +
      Math.pow((sensor.lng - CENTRE_LNG) * 0.71, 2) // lng degrees shorter at this latitude
    );
    const centreFactor = Math.max(0, 1 - distDeg / MAX_RADIUS);

    // Centre sensors get far more vehicles during rush hour than peripheral ones
    const baseVehicles = isRushHour
      ? Math.round(20 + centreFactor * 55) // centre ≈ 75, edge ≈ 20
      : Math.round(8  + centreFactor * 17); // centre ≈ 25, edge ≈ 8
    const range = isRushHour ? 20 : 12;
    const vehicleCount = Math.floor(randomInRange(baseVehicles, baseVehicles + range));

    // Centre is slower during rush hour
    const speedMin = isRushHour ? 15 + (1 - centreFactor) * 15 : 30;
    const speedMax = isRushHour ? 30 + (1 - centreFactor) * 15 : 50;
    const averageSpeed = randomInRange(speedMin, speedMax);
    
    let congestionLevel: 'low' | 'medium' | 'high' = 'low';
    if (vehicleCount > 60) congestionLevel = 'high';
    else if (vehicleCount > 40) congestionLevel = 'medium';
    
    return {
      sensorId: sensor.id,
      timestamp: Date.now(),
      vehicleCount,
      averageSpeed: Math.round(Math.max(5, averageSpeed) * 10) / 10,
      congestionLevel
    };
  });
};

// Simulate environment data
export const generateEnvironmentData = (): EnvironmentData[] => {
  const sensorLocations = getSensorLocations(); // Load fresh data
  const envSensors = sensorLocations.filter(s => s.type === 'environment');
  
  return envSensors.map(sensor => {
    const temperature = randomInRange(18, 28);
    const humidity = randomInRange(40, 70);
    const pm25 = randomInRange(10, 50);
    const pm10 = randomInRange(20, 80);
    const aqi = Math.round((pm25 + pm10) / 2);
    
    return {
      sensorId: sensor.id,
      timestamp: Date.now(),
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      airQuality: {
        pm25: Math.round(pm25 * 10) / 10,
        pm10: Math.round(pm10 * 10) / 10,
        aqi
      }
    };
  });
};

// Simulate energy data
export const generateEnergyData = (): EnergyData[] => {
  const sensorLocations = getSensorLocations(); // Load fresh data
  const energySensors = sensorLocations.filter(s => s.type === 'energy');
  
  return energySensors.map(sensor => {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 20;
    const consumption = isDaytime ? randomInRange(0.5, 2) : randomInRange(3, 8);
    
    return {
      sensorId: sensor.id,
      timestamp: Date.now(),
      consumption: Math.round(consumption * 100) / 100,
      type: 'street-light'
    };
  });
};

// Simulate parking data
export const generateParkingData = (): ParkingData[] => {
  const sensorLocations = getSensorLocations(); // Load fresh data
  const parkingSensors = sensorLocations.filter(s => s.type === 'parking');
  
  return parkingSensors.map(sensor => {
    const totalSpaces = sensor.id === 'parking-001' ? 50 : 30;
    const occupiedSpaces = Math.floor(randomInRange(totalSpaces * 0.3, totalSpaces * 0.9));
    
    return {
      sensorId: sensor.id,
      timestamp: Date.now(),
      totalSpaces,
      occupiedSpaces,
      availableSpaces: totalSpaces - occupiedSpaces
    };
  });
};

// Simulate traffic light data
export const generateTrafficLightData = (): TrafficLightData[] => {
  const sensorLocations = getSensorLocations(); // Load fresh data
  const lightSensors = sensorLocations.filter(s => s.type === 'traffic-light');
  
  return lightSensors.map(sensor => {
    const statuses: Array<'red' | 'yellow' | 'green'> = ['red', 'yellow', 'green'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const nextChangeIn = status === 'green' ? 30 : status === 'yellow' ? 3 : 25;
    
    return {
      sensorId: sensor.id,
      timestamp: Date.now(),
      status,
      nextChangeIn
    };
  });
};

// Calculate city-wide metrics
export const calculateCityMetrics = (
  trafficData: TrafficData[],
  environmentData: EnvironmentData[],
  energyData: EnergyData[],
  parkingData: ParkingData[]
): CityMetrics => {
  // Use average per sensor × city scale factor so the metric doesn't
  // inflate when more sensors are added (sensor-count independent).
  const avgVehiclesPerSensor = trafficData.length > 0
    ? trafficData.reduce((sum, d) => sum + d.vehicleCount, 0) / trafficData.length
    : 0;
  const totalVehicles = Math.round(avgVehiclesPerSensor * 8);

  const avgAqi = environmentData.reduce((sum, d) => sum + d.airQuality.aqi, 0) / environmentData.length;
  
  const totalEnergy = energyData.reduce((sum, d) => sum + d.consumption, 0);
  
  const totalParking = parkingData.reduce((sum, d) => sum + d.totalSpaces, 0);
  const occupiedParking = parkingData.reduce((sum, d) => sum + d.occupiedSpaces, 0);
  const parkingOccupancy = (occupiedParking / totalParking) * 100;
  
  return {
    totalVehicles,
    averageAirQuality: Math.round(avgAqi),
    totalEnergyConsumption: Math.round(totalEnergy * 100) / 100,
    parkingOccupancy: Math.round(parkingOccupancy)
  };
};

// Generate all simulation data
export const generateAllData = () => {
  const traffic = generateTrafficData();
  const environment = generateEnvironmentData();
  const energy = generateEnergyData();
  const parking = generateParkingData();
  const trafficLights = generateTrafficLightData();
  const metrics = calculateCityMetrics(traffic, environment, energy, parking);
  
  return {
    traffic,
    environment,
    energy,
    parking,
    trafficLights,
    metrics,
    locations: getSensorLocations(), // Load fresh data
    timestamp: Date.now()
  };
};
