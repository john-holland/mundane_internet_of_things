declare module 'kalmanjs' {
  export default class KalmanFilter {
    constructor(R?: number, Q?: number);
    filter(measurement: number): number;
    R: number; // Measurement noise
    Q: number; // Process noise
  }
} 