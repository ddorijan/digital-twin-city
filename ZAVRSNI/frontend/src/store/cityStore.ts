import { create } from 'zustand';
import type { CityData } from '../types';

interface CityStore {
  cityData: CityData | null;
  isConnected: boolean;
  updateCityData: (data: CityData) => void;
  setConnected: (connected: boolean) => void;
}

export const useCityStore = create<CityStore>((set) => ({
  cityData: null,
  isConnected: false,
  updateCityData: (data) => {
    console.log('📊 Received city data:', data);
    set({ cityData: data });
  },
  setConnected: (connected) => {
    console.log('🔌 Connection status:', connected);
    set({ isConnected: connected });
  },
}));
