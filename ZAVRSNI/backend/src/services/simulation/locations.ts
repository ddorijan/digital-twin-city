import type { SensorLocation } from '../../types/index.js';

// Đakovo city center sensor locations
export const sensorLocations: SensorLocation[] = [
  // Traffic sensors
  {
    id: 'traffic-001',
    name: 'Trg Pape Ivana Pavla II',
    lat: 45.3089,
    lng: 18.4103,
    type: 'traffic'
  },
  {
    id: 'traffic-002',
    name: 'Korzo',
    lat: 45.3095,
    lng: 18.4115,
    type: 'traffic'
  },
  {
    id: 'traffic-003',
    name: 'Ulica kralja Tomislava',
    lat: 45.3082,
    lng: 18.4098,
    type: 'traffic'
  },
  // Environment sensors
  {
    id: 'env-001',
    name: 'Katedrala Sv. Petra',
    lat: 45.3086,
    lng: 18.4108,
    type: 'environment'
  },
  {
    id: 'env-002',
    name: 'Gradski park',
    lat: 45.3100,
    lng: 18.4120,
    type: 'environment'
  },
  // Parking sensors
  {
    id: 'parking-001',
    name: 'Parking centar',
    lat: 45.3092,
    lng: 18.4100,
    type: 'parking'
  },
  {
    id: 'parking-002',
    name: 'Parking Korzo',
    lat: 45.3098,
    lng: 18.4118,
    type: 'parking'
  },
  // Traffic lights
  {
    id: 'light-001',
    name: 'Raskrižje Trg',
    lat: 45.3090,
    lng: 18.4105,
    type: 'traffic-light'
  },
  {
    id: 'light-002',
    name: 'Raskrižje Korzo',
    lat: 45.3096,
    lng: 18.4113,
    type: 'traffic-light'
  },
  // Energy sensors
  {
    id: 'energy-001',
    name: 'Javna rasvjeta Trg',
    lat: 45.3089,
    lng: 18.4103,
    type: 'energy'
  }
];
