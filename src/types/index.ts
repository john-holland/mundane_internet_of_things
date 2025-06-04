export interface SensorData {
  timestamp: number;
  values: number[];
  type: SensorType;
}

export type SensorType = 'audio' | 'accelerometer' | 'gyroscope' | 'camera' | 'light';

export interface PatternConfig {
  name: string;
  sensorType: SensorType;
  features: string[];
  threshold: number;
  audioBuffer?: AudioBufferConfig;
}

export interface AudioBufferConfig {
  enabled: boolean;
  duration: number; // Duration in seconds
  sampleRate: number;
}

export interface Device {
  id: string;
  name: string;
  sensorType: SensorType;
  threshold: number;
  features: string[];
  audioBuffer?: AudioBufferConfig;
}

export interface SensorConfig {
  type: SensorType;
  sampleRate: number;
  enabled: boolean;
}

// Web API types
declare global {
  interface Window {
    Accelerometer: typeof Accelerometer;
    Gyroscope: typeof Gyroscope;
    AmbientLightSensor: typeof AmbientLightSensor;
  }
}

export interface Accelerometer extends Sensor {
  x: number;
  y: number;
  z: number;
}

export interface Gyroscope extends Sensor {
  x: number;
  y: number;
  z: number;
}

export interface AmbientLightSensor extends Sensor {
  illuminance: number;
}

export interface Sensor {
  start(): void;
  stop(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
} 