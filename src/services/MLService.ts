import * as tf from '@tensorflow/tfjs';
import KalmanFilter from 'kalmanjs';
import KNN from 'ml-knn';
import { SensorData, Device } from '../types';
import { AudioBufferService } from './AudioBufferService';

interface PatternConfig {
  name: string;
  sensorType: SensorData['type'];
  features: string[];
  threshold: number;
  audioBuffer?: {
    enabled: boolean;
    duration: number;
    sampleRate: number;
  };
}

export class MLService {
  private knn: KNN;
  private kalmanFilters: Map<string, KalmanFilter>;
  private audioBufferService: AudioBufferService;
  private patterns: Map<string, PatternConfig>;

  constructor() {
    this.knn = new KNN();
    this.kalmanFilters = new Map();
    this.audioBufferService = new AudioBufferService();
    this.patterns = new Map([
      ['walking', {
        name: 'walking',
        sensorType: 'accelerometer',
        features: ['accelerometer_x', 'accelerometer_y', 'accelerometer_z'],
        threshold: 0.65,
        audioBuffer: {
          enabled: true,
          duration: 60,
          sampleRate: 44100
        }
      }],
      ['dog_barking', {
        name: 'dog_barking',
        sensorType: 'audio',
        features: ['audio_rms', 'audio_frequency'],
        threshold: 0.7,
        audioBuffer: {
          enabled: true,
          duration: 30,
          sampleRate: 44100
        }
      }],
      ['cat_meowing', {
        name: 'cat_meowing',
        sensorType: 'audio',
        features: ['audio_rms', 'audio_frequency'],
        threshold: 0.7,
        audioBuffer: {
          enabled: true,
          duration: 30,
          sampleRate: 44100
        }
      }],
      ['animal_noise', {
        name: 'animal_noise',
        sensorType: 'audio',
        features: ['audio_rms', 'audio_frequency'],
        threshold: 0.7,
        audioBuffer: {
          enabled: true,
          duration: 30,
          sampleRate: 44100
        }
      }]
    ]);
  }

  async initialize() {
    await tf.ready();
    this.setupDefaultPatterns();
  }

  private setupDefaultPatterns() {
    // Define default patterns for common household tasks
    const defaultPatterns: PatternConfig[] = [
      {
        name: 'dishwasher',
        sensorType: 'audio',
        features: ['frequency', 'amplitude', 'duration'],
        threshold: 0.8,
        audioBuffer: {
          enabled: true,
          duration: 300,
          sampleRate: 44100
        }
      },
      {
        name: 'kettle',
        sensorType: 'audio',
        features: ['frequency', 'amplitude'],
        threshold: 0.7,
        audioBuffer: {
          enabled: true,
          duration: 180,
          sampleRate: 44100
        }
      },
      {
        name: 'plant_light',
        sensorType: 'light',
        features: ['intensity', 'duration'],
        threshold: 0.6
      },
      {
        name: 'washer',
        sensorType: 'accelerometer',
        features: ['vibration', 'frequency', 'duration'],
        threshold: 0.75
      },
      {
        name: 'dryer',
        sensorType: 'accelerometer',
        features: ['vibration', 'frequency', 'duration'],
        threshold: 0.75
      },
      {
        name: 'walking',
        sensorType: 'accelerometer',
        features: ['step_frequency', 'amplitude', 'pattern'],
        threshold: 0.65,
        audioBuffer: {
          enabled: true,
          duration: 60,
          sampleRate: 44100
        }
      },
      {
        name: 'dog_barking',
        sensorType: 'audio',
        features: ['frequency', 'amplitude', 'duration', 'pattern'],
        threshold: 0.7,
        audioBuffer: {
          enabled: true,
          duration: 30,
          sampleRate: 44100
        }
      },
      {
        name: 'cat_meowing',
        sensorType: 'audio',
        features: ['frequency', 'amplitude', 'duration', 'pattern'],
        threshold: 0.7,
        audioBuffer: {
          enabled: true,
          duration: 30,
          sampleRate: 44100
        }
      },
      {
        name: 'animal_noise',
        sensorType: 'audio',
        features: ['frequency', 'amplitude', 'duration', 'pattern'],
        threshold: 0.6,
        audioBuffer: {
          enabled: true,
          duration: 30,
          sampleRate: 44100
        }
      }
    ];

    defaultPatterns.forEach(pattern => {
      this.patterns.set(pattern.name, pattern);
      this.kalmanFilters.set(pattern.name, new KalmanFilter());
      
      if (pattern.audioBuffer?.enabled) {
        this.audioBufferService.startBuffer(pattern.name, pattern.audioBuffer);
      }
    });
  }

  async processSensorData(data: SensorData): Promise<Map<string, number>> {
    const features = this.extractFeatures(data);
    const predictions = new Map<string, number>();

    for (const [pattern, config] of this.patterns.entries()) {
      if (config.sensorType === data.type) {
        const confidence = this.calculateConfidence(features, pattern);
        predictions.set(pattern, confidence);

        if (confidence > config.threshold && config.audioBuffer?.enabled) {
          this.audioBufferService.addAudioData(pattern, new Float32Array(data.values));
        }
      }
    }

    return predictions;
  }

  private extractFeatures(data: SensorData): number[] {
    const features: number[] = [];

    switch (data.type) {
      case 'audio':
        // Calculate RMS and dominant frequency
        const rms = Math.sqrt(data.values.reduce((sum, val) => sum + val * val, 0) / data.values.length);
        const fft = this.performFFT(data.values);
        const dominantFreq = this.findDominantFrequency(fft);
        features.push(rms, dominantFreq);
        break;

      case 'accelerometer':
        // Use raw accelerometer values
        features.push(...data.values);
        break;

      case 'gyroscope':
        // Use raw gyroscope values
        features.push(...data.values);
        break;

      case 'light':
        // Use raw light value
        features.push(data.values[0]);
        break;
    }

    return features;
  }

  private calculateConfidence(features: number[], pattern: string): number {
    const config = this.patterns.get(pattern);
    if (!config) return 0;

    // Apply Kalman filter if not already initialized
    if (!this.kalmanFilters.has(pattern)) {
      this.kalmanFilters.set(pattern, new KalmanFilter());
    }

    const kalmanFilter = this.kalmanFilters.get(pattern)!;
    const filteredFeatures = features.map(f => kalmanFilter.filter(f));

    // Simple confidence calculation based on feature similarity
    // In a real implementation, this would use the trained KNN model
    const confidence = Math.random(); // Placeholder for actual ML prediction
    return Math.min(Math.max(confidence, 0), 1);
  }

  private performFFT(signal: number[]): number[] {
    // Placeholder for FFT implementation
    return signal;
  }

  private findDominantFrequency(fft: number[]): number {
    // Placeholder for dominant frequency detection
    return 0;
  }

  getAudioBuffer(pattern: string): Blob | null {
    return this.audioBufferService.exportBuffer(pattern);
  }

  startBuffer(pattern: string): void {
    const config = this.patterns.get(pattern);
    if (config?.audioBuffer?.enabled) {
      this.audioBufferService.startBuffer(pattern, config.audioBuffer);
    }
  }

  stopBuffer(pattern: string): void {
    this.audioBufferService.stopBuffer(pattern);
  }
} 