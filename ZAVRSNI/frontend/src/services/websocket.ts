import { io, Socket } from 'socket.io-client';
import type { CityData } from '../types';

const SOCKET_URL = 'http://localhost:3001';

export interface CityEventPayload {
  action: 'created' | 'resolved';
  event?: {
    id: number;
    event_type: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    severity: string;
    status: string;
  };
  id?: number;
}

export interface CityAlertPayload {
  id: number;
  sensor_id?: string;
  alert_type: string;
  severity?: string;
  message: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: ((data: CityData) => void)[] = [];
  private eventListeners: ((payload: CityEventPayload) => void)[] = [];
  private alertListeners: ((payload: CityAlertPayload[]) => void)[] = [];

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
    });

    this.socket.on('city-data', (data: CityData) => {
      this.listeners.forEach(listener => listener(data));
    });

    this.socket.on('city-event', (payload: CityEventPayload) => {
      this.eventListeners.forEach(listener => listener(payload));
    });

    this.socket.on('city-alert', (payload: CityAlertPayload[]) => {
      this.alertListeners.forEach(listener => listener(payload));
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onData(callback: (data: CityData) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  onCityEvent(callback: (payload: CityEventPayload) => void) {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== callback);
    };
  }

  onCityAlert(callback: (payload: CityAlertPayload[]) => void) {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter(l => l !== callback);
    };
  }

  requestData() {
    if (this.socket?.connected) {
      this.socket.emit('request-data');
    }
  }
}

export const websocketService = new WebSocketService();
