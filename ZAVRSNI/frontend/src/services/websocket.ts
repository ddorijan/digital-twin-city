import { io, Socket } from 'socket.io-client';
import type { CityData } from '../types';

const SOCKET_URL = 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: ((data: CityData) => void)[] = [];

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

  requestData() {
    if (this.socket?.connected) {
      this.socket.emit('request-data');
    }
  }
}

export const websocketService = new WebSocketService();
