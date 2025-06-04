import { SensorData } from '../types';

export interface SensorConfig {
  type: SensorData['type'];
  sampleRate: number;
  enabled: boolean;
}

export class SensorService {
  private sensors: Map<string, SensorConfig>;
  private audioContext: AudioContext | null;
  private mediaStream: MediaStream | null;
  private accelerometer: Accelerometer | null;
  private gyroscope: Gyroscope | null;
  private ambientLight: AmbientLightSensor | null;
  public onSensorData: ((data: SensorData) => void) | null;

  constructor() {
    this.sensors = new Map();
    this.audioContext = null;
    this.mediaStream = null;
    this.accelerometer = null;
    this.gyroscope = null;
    this.ambientLight = null;
    this.onSensorData = null;
  }

  async initialize() {
    // Initialize default sensors
    this.setupDefaultSensors();
    await this.requestPermissions();
  }

  private setupDefaultSensors() {
    const defaultSensors: SensorConfig[] = [
      { type: 'audio', sampleRate: 44100, enabled: true },
      { type: 'accelerometer', sampleRate: 60, enabled: true },
      { type: 'gyroscope', sampleRate: 60, enabled: true },
      { type: 'light', sampleRate: 1, enabled: true }
    ];

    defaultSensors.forEach(sensor => {
      this.sensors.set(sensor.type, sensor);
    });
  }

  private async requestPermissions() {
    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }

  async startSensor(type: SensorData['type']): Promise<void> {
    const sensor = this.sensors.get(type);
    if (!sensor) {
      throw new Error(`Sensor type ${type} not found`);
    }

    switch (type) {
      case 'audio':
        await this.startAudioSensor();
        break;
      case 'accelerometer':
        await this.startAccelerometer();
        break;
      case 'gyroscope':
        await this.startGyroscope();
        break;
      case 'light':
        await this.startLightSensor();
        break;
    }
  }

  private async startAudioSensor() {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('Audio context or media stream not initialized');
    }

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const dataArray = new Float32Array(analyser.frequencyBinCount);
    
    const processAudio = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const sensorData: SensorData = {
        timestamp: Date.now(),
        values: Array.from(dataArray),
        type: 'audio'
      };
      this.onSensorData?.(sensorData);
      requestAnimationFrame(processAudio);
    };

    processAudio();
  }

  private async startAccelerometer() {
    if ('Accelerometer' in window) {
      this.accelerometer = new Accelerometer({ frequency: 60 });
      this.accelerometer.addEventListener('reading', () => {
        const sensorData: SensorData = {
          timestamp: Date.now(),
          values: [
            this.accelerometer!.x,
            this.accelerometer!.y,
            this.accelerometer!.z
          ],
          type: 'accelerometer'
        };
        this.onSensorData?.(sensorData);
      });
      this.accelerometer.start();
    }
  }

  private async startGyroscope() {
    if ('Gyroscope' in window) {
      this.gyroscope = new Gyroscope({ frequency: 60 });
      this.gyroscope.addEventListener('reading', () => {
        const sensorData: SensorData = {
          timestamp: Date.now(),
          values: [
            this.gyroscope!.x,
            this.gyroscope!.y,
            this.gyroscope!.z
          ],
          type: 'gyroscope'
        };
        this.onSensorData?.(sensorData);
      });
      this.gyroscope.start();
    }
  }

  private async startLightSensor() {
    if ('AmbientLightSensor' in window) {
      this.ambientLight = new AmbientLightSensor();
      this.ambientLight.addEventListener('reading', () => {
        const sensorData: SensorData = {
          timestamp: Date.now(),
          values: [this.ambientLight!.illuminance],
          type: 'light'
        };
        this.onSensorData?.(sensorData);
      });
      this.ambientLight.start();
    }
  }

  stopSensor(type: SensorData['type']): void {
    switch (type) {
      case 'audio':
        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.audioContext?.close();
        break;
      case 'accelerometer':
        this.accelerometer?.stop();
        break;
      case 'gyroscope':
        this.gyroscope?.stop();
        break;
      case 'light':
        this.ambientLight?.stop();
        break;
    }
  }

  cleanup() {
    this.sensors.forEach((_, type) => this.stopSensor(type as SensorData['type']));
    this.onSensorData = null;
  }
} 