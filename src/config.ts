import { Device, SensorType } from './types';

export const CONFIG = {
  app: {
    name: 'Mundane Internet of Things',
    version: '0.1.0',
    debug: process.env.NODE_ENV !== 'production'
  },
  
  devices: [
    {
      id: 'dishwasher',
      name: 'Dishwasher',
      sensorType: 'audio' as SensorType,
      features: ['frequency', 'amplitude', 'duration'],
      threshold: 0.8,
      audioBuffer: {
        enabled: true,
        duration: 300, // 5 minutes
        sampleRate: 44100
      }
    },
    {
      id: 'kettle',
      name: 'Kettle',
      sensorType: 'audio' as SensorType,
      features: ['frequency', 'amplitude'],
      threshold: 0.7,
      audioBuffer: {
        enabled: true,
        duration: 180, // 3 minutes
        sampleRate: 44100
      }
    },
    {
      id: 'plant_light',
      name: 'Plant Light',
      sensorType: 'light' as SensorType,
      features: ['intensity', 'duration'],
      threshold: 0.6
    },
    {
      id: 'washer',
      name: 'Washing Machine',
      sensorType: 'accelerometer' as SensorType,
      features: ['vibration', 'frequency', 'duration'],
      threshold: 0.75
    },
    {
      id: 'dryer',
      name: 'Dryer',
      sensorType: 'accelerometer' as SensorType,
      features: ['vibration', 'frequency', 'duration'],
      threshold: 0.75
    },
    {
      id: 'walking',
      name: 'Walking Detection',
      sensorType: 'accelerometer' as SensorType,
      features: ['step_frequency', 'amplitude', 'pattern'],
      threshold: 0.65,
      audioBuffer: {
        enabled: true,
        duration: 60, // 1 minute
        sampleRate: 44100
      }
    },
    {
      id: 'dog_barking',
      name: 'Dog Barking',
      sensorType: 'audio' as SensorType,
      features: ['frequency', 'amplitude', 'duration', 'pattern'],
      threshold: 0.7,
      audioBuffer: {
        enabled: true,
        duration: 30, // 30 seconds
        sampleRate: 44100
      }
    },
    {
      id: 'cat_meowing',
      name: 'Cat Meowing',
      sensorType: 'audio' as SensorType,
      features: ['frequency', 'amplitude', 'duration', 'pattern'],
      threshold: 0.7,
      audioBuffer: {
        enabled: true,
        duration: 30, // 30 seconds
        sampleRate: 44100
      }
    },
    {
      id: 'animal_noise',
      name: 'Other Animal Sounds',
      sensorType: 'audio' as SensorType,
      features: ['frequency', 'amplitude', 'duration', 'pattern'],
      threshold: 0.6,
      audioBuffer: {
        enabled: true,
        duration: 30, // 30 seconds
        sampleRate: 44100
      }
    }
  ] as Device[],

  sensors: {
    audio: {
      sampleRate: 44100,
      fftSize: 2048,
      bufferSize: 1024
    },
    accelerometer: {
      frequency: 60,
      threshold: 0.1
    },
    gyroscope: {
      frequency: 60,
      threshold: 0.1
    },
    light: {
      frequency: 1,
      threshold: 50 // lux
    }
  },

  ml: {
    knn: {
      k: 3,
      distance: 'euclidean'
    },
    kalman: {
      R: 0.01, // Measurement noise
      Q: 0.1   // Process noise
    }
  },

  notifications: {
    default: {
      priority: 'high' as const,
      vibration: [200, 100, 200],
      sound: true
    },
    error: {
      priority: 'high' as const,
      vibration: [500, 100, 500],
      sound: true
    }
  },

  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: 5000,
    retries: 3
  },

  storage: {
    prefix: 'mundane-iot-',
    version: 1
  }
}; 