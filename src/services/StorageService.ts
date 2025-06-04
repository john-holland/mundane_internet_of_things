import { CONFIG } from '../config';
import { SensorData, PatternConfig } from '../types';

export class StorageService {
  private prefix: string;
  private version: number;

  constructor() {
    this.prefix = CONFIG.storage.prefix;
    this.version = CONFIG.storage.version;
  }

  private getKey(key: string): string {
    return `${this.prefix}v${this.version}-${key}`;
  }

  async saveSensorData(deviceId: string, data: SensorData[]): Promise<void> {
    const key = this.getKey(`sensor-data-${deviceId}`);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving sensor data:', error);
      // If localStorage is full, remove oldest data
      this.cleanupOldData();
      // Try saving again
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async getSensorData(deviceId: string): Promise<SensorData[]> {
    const key = this.getKey(`sensor-data-${deviceId}`);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async savePatternConfig(pattern: PatternConfig): Promise<void> {
    const key = this.getKey(`pattern-${pattern.name}`);
    localStorage.setItem(key, JSON.stringify(pattern));
  }

  async getPatternConfig(patternName: string): Promise<PatternConfig | null> {
    const key = this.getKey(`pattern-${patternName}`);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async saveTrainingData(patternName: string, data: SensorData[]): Promise<void> {
    const key = this.getKey(`training-${patternName}`);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving training data:', error);
      this.cleanupOldData();
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async getTrainingData(patternName: string): Promise<SensorData[]> {
    const key = this.getKey(`training-${patternName}`);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async saveDeviceSettings(deviceId: string, settings: any): Promise<void> {
    const key = this.getKey(`settings-${deviceId}`);
    localStorage.setItem(key, JSON.stringify(settings));
  }

  async getDeviceSettings(deviceId: string): Promise<any> {
    const key = this.getKey(`settings-${deviceId}`);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private cleanupOldData(): void {
    // Remove data from previous versions
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const version = parseInt(key.split('v')[1].split('-')[0]);
        if (version < this.version) {
          localStorage.removeItem(key);
        }
      }
    }

    // If still full, remove oldest sensor data
    const sensorDataKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(this.getKey('sensor-data-')))
      .sort((a, b) => {
        const timeA = localStorage.getItem(a)?.split('"timestamp":')[1]?.split(',')[0] || '0';
        const timeB = localStorage.getItem(b)?.split('"timestamp":')[1]?.split(',')[0] || '0';
        return parseInt(timeA) - parseInt(timeB);
      });

    // Remove oldest 20% of data
    const removeCount = Math.ceil(sensorDataKeys.length * 0.2);
    for (let i = 0; i < removeCount; i++) {
      localStorage.removeItem(sensorDataKeys[i]);
    }
  }

  async clearAll(): Promise<void> {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  async exportData(): Promise<string> {
    const data: { [key: string]: any } = {};
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => {
        data[key] = localStorage.getItem(key);
      });
    return JSON.stringify(data);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith(this.prefix)) {
        localStorage.setItem(key, value as string);
      }
    });
  }
} 