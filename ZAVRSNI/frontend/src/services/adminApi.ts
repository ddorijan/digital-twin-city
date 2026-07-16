import type { SensorLocation } from '../types';

const API_URL = 'http://localhost:3001/api/admin';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

// Login
export const loginAdmin = async (password: string): Promise<{ success: boolean; token?: string; message?: string }> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Connection error' };
  }
};

// Logout
export const logoutAdmin = async (): Promise<void> => {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Get all sensors
export const fetchSensors = async (): Promise<SensorLocation[]> => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/sensors`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sensors');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Fetch sensors error:', error);
    return [];
  }
};

// Add sensor
export const createSensor = async (sensor: SensorLocation): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/sensors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sensor)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create sensor error:', error);
    return { success: false, message: 'Connection error' };
  }
};

// Update sensor
export const updateSensor = async (id: string, sensor: SensorLocation): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/sensors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sensor)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update sensor error:', error);
    return { success: false, message: 'Connection error' };
  }
};

// Delete sensor
export const deleteSensor = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/sensors/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete sensor error:', error);
    return { success: false, message: 'Connection error' };
  }
};
