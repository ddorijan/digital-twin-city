import { create } from 'zustand';
import type { SensorLocation } from '../types';

interface AdminStore {
  isAuthenticated: boolean;
  token: string | null;
  sensors: SensorLocation[];
  login: (token: string) => void;
  logout: () => void;
  setSensors: (sensors: SensorLocation[]) => void;
  addSensor: (sensor: SensorLocation) => void;
  updateSensor: (id: string, sensor: SensorLocation) => void;
  removeSensor: (id: string) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  isAuthenticated: !!localStorage.getItem('adminToken'),
  token: localStorage.getItem('adminToken'),
  sensors: [],
  
  login: (token: string) => {
    localStorage.setItem('adminToken', token);
    set({ isAuthenticated: true, token });
  },
  
  logout: () => {
    localStorage.removeItem('adminToken');
    set({ isAuthenticated: false, token: null, sensors: [] });
  },
  
  setSensors: (sensors: SensorLocation[]) => {
    set({ sensors });
  },
  
  addSensor: (sensor: SensorLocation) => {
    set((state) => ({ sensors: [...state.sensors, sensor] }));
  },
  
  updateSensor: (id: string, sensor: SensorLocation) => {
    set((state) => ({
      sensors: state.sensors.map(s => s.id === id ? sensor : s)
    }));
  },
  
  removeSensor: (id: string) => {
    set((state) => ({
      sensors: state.sensors.filter(s => s.id !== id)
    }));
  },
}));
