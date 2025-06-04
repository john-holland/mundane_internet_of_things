interface Accelerometer extends Sensor {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface Gyroscope extends Sensor {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface AmbientLightSensor extends Sensor {
  readonly illuminance: number;
}

interface Sensor {
  start(): void;
  stop(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface SensorOptions {
  frequency?: number;
}

declare class Accelerometer implements Accelerometer {
  constructor(options?: SensorOptions);
}

declare class Gyroscope implements Gyroscope {
  constructor(options?: SensorOptions);
}

declare class AmbientLightSensor implements AmbientLightSensor {
  constructor(options?: SensorOptions);
} 