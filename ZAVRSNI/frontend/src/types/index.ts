// Frontend types matching backend
export type SensorStatus = 'normal' | 'warning' | 'critical';
export type SensorType = 'traffic' | 'environment' | 'energy' | 'parking' | 'traffic-light';

export interface SensorLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: SensorType;
}

export interface TrafficData {
  sensorId: string;
  timestamp: number;
  vehicleCount: number;
  averageSpeed: number;
  congestionLevel: 'low' | 'medium' | 'high';
}

export interface EnvironmentData {
  sensorId: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  airQuality: {
    pm25: number;
    pm10: number;
    aqi: number;
  };
}

export interface EnergyData {
  sensorId: string;
  timestamp: number;
  consumption: number;
  type: 'street-light' | 'building';
}

export interface ParkingData {
  sensorId: string;
  timestamp: number;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
}

export interface TrafficLightData {
  sensorId: string;
  timestamp: number;
  status: 'red' | 'yellow' | 'green';
  nextChangeIn: number;
}

export interface CityMetrics {
  totalVehicles: number;
  averageAirQuality: number;
  totalEnergyConsumption: number;
  parkingOccupancy: number;
}

export interface CityData {
  traffic: TrafficData[];
  environment: EnvironmentData[];
  energy: EnergyData[];
  parking: ParkingData[];
  trafficLights: TrafficLightData[];
  metrics: CityMetrics;
  locations: SensorLocation[];
  timestamp: number;
}

export interface LiveFeedEntry {
  id: string;
  timestamp: number;
  sensorId: string;
  sensorName: string;
  type: SensorType;
  status: SensorStatus;
  message: string;
}

export interface MetricSnapshot {
  time: string;
  totalVehicles: number;
  averageAirQuality: number;
  totalEnergyConsumption: number;
  parkingOccupancy: number;
}
