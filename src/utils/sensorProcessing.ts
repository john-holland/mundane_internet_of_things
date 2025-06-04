import { SensorData } from '../types';

export function calculateRMS(values: number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

export function calculateFrequency(values: number[], sampleRate: number): number {
  // Simple zero-crossing rate for frequency estimation
  let crossings = 0;
  for (let i = 1; i < values.length; i++) {
    if ((values[i] >= 0 && values[i - 1] < 0) || (values[i] < 0 && values[i - 1] >= 0)) {
      crossings++;
    }
  }
  return (crossings * sampleRate) / (2 * values.length);
}

export function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
}

export function normalizeData(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  return values.map(value => (value - min) / range);
}

export function extractFeatures(data: SensorData): number[] {
  const features: number[] = [];
  
  switch (data.type) {
    case 'audio':
      features.push(
        calculateRMS(data.values),
        calculateFrequency(data.values, 44100), // Assuming 44.1kHz sample rate
        calculateVariance(data.values)
      );
      break;
      
    case 'accelerometer':
    case 'gyroscope':
      // Split values into x, y, z components
      const x = data.values.filter((_, i) => i % 3 === 0);
      const y = data.values.filter((_, i) => i % 3 === 1);
      const z = data.values.filter((_, i) => i % 3 === 2);
      
      features.push(
        calculateRMS(x),
        calculateRMS(y),
        calculateRMS(z),
        calculateVariance(x),
        calculateVariance(y),
        calculateVariance(z)
      );
      break;
      
    case 'light':
      features.push(
        calculateRMS(data.values),
        calculateVariance(data.values)
      );
      break;
  }
  
  return normalizeData(features);
}

export function detectPatternChange(
  currentFeatures: number[],
  previousFeatures: number[],
  threshold: number
): boolean {
  if (previousFeatures.length === 0) return false;
  
  const differences = currentFeatures.map((value, index) => 
    Math.abs(value - previousFeatures[index])
  );
  
  const averageDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  return averageDifference > threshold;
}

export function calculateConfidence(
  currentFeatures: number[],
  referenceFeatures: number[],
  threshold: number
): number {
  if (referenceFeatures.length === 0) return 0;
  
  const differences = currentFeatures.map((value, index) => 
    Math.abs(value - referenceFeatures[index])
  );
  
  const averageDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  return Math.max(0, 1 - (averageDifference / threshold));
} 