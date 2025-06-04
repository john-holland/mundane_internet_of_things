import { MLService } from './MLService';
import { StorageService } from './StorageService';
import { SensorData, PatternConfig } from '../types';
import { extractFeatures, calculateConfidence } from '../utils/sensorProcessing';
import { CONFIG } from '../config';

export interface TrainingResult {
  patternName: string;
  accuracy: number;
  samples: number;
  features: number[];
  timestamp: number;
}

export class TrainingService {
  private mlService: MLService;
  private storageService: StorageService;
  private isTraining: boolean = false;

  constructor(mlService: MLService, storageService: StorageService) {
    this.mlService = mlService;
    this.storageService = storageService;
  }

  async startTraining(
    patternName: string,
    sensorData: SensorData[],
    validationData?: SensorData[]
  ): Promise<TrainingResult> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    this.isTraining = true;
    try {
      // Extract features from training data
      const trainingFeatures = sensorData.map(data => extractFeatures(data));
      
      // Train the model
      await this.mlService.trainPattern(patternName, sensorData);
      
      // Validate if validation data is provided
      let accuracy = 1.0;
      if (validationData && validationData.length > 0) {
        accuracy = await this.validateModel(patternName, validationData);
      }

      // Save training data
      await this.storageService.saveTrainingData(patternName, sensorData);

      const result: TrainingResult = {
        patternName,
        accuracy,
        samples: sensorData.length,
        features: trainingFeatures[0], // Store first sample's features as reference
        timestamp: Date.now()
      };

      return result;
    } finally {
      this.isTraining = false;
    }
  }

  private async validateModel(
    patternName: string,
    validationData: SensorData[]
  ): Promise<number> {
    let correctPredictions = 0;
    const totalSamples = validationData.length;

    for (const data of validationData) {
      const patterns = await this.mlService.processSensorData(data);
      const confidence = patterns.get(patternName) || 0;
      
      // Consider it correct if confidence is above threshold
      if (confidence >= CONFIG.devices.find(d => d.id === patternName)?.threshold || 0.7) {
        correctPredictions++;
      }
    }

    return correctPredictions / totalSamples;
  }

  async collectTrainingData(
    patternName: string,
    duration: number = 30000 // 30 seconds default
  ): Promise<SensorData[]> {
    return new Promise((resolve) => {
      const data: SensorData[] = [];
      const startTime = Date.now();

      const collectData = (sensorData: SensorData) => {
        if (Date.now() - startTime < duration) {
          data.push(sensorData);
        } else {
          resolve(data);
        }
      };

      // Set up data collection
      this.mlService.onSensorData = collectData;

      // Clean up after duration
      setTimeout(() => {
        this.mlService.onSensorData = null;
      }, duration);
    });
  }

  async evaluateModel(
    patternName: string,
    testData: SensorData[]
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    const threshold = CONFIG.devices.find(d => d.id === patternName)?.threshold || 0.7;

    for (const data of testData) {
      const patterns = await this.mlService.processSensorData(data);
      const confidence = patterns.get(patternName) || 0;

      if (confidence >= threshold) {
        truePositives++;
      } else {
        falseNegatives++;
      }
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      accuracy: (truePositives + falseNegatives) / testData.length,
      precision,
      recall,
      f1Score
    };
  }

  async optimizeModel(
    patternName: string,
    trainingData: SensorData[],
    validationData: SensorData[]
  ): Promise<{
    bestThreshold: number;
    bestAccuracy: number;
  }> {
    const thresholds = [0.5, 0.6, 0.7, 0.8, 0.9];
    let bestThreshold = 0.7;
    let bestAccuracy = 0;

    for (const threshold of thresholds) {
      // Update threshold
      const pattern = await this.storageService.getPatternConfig(patternName);
      if (pattern) {
        pattern.threshold = threshold;
        await this.storageService.savePatternConfig(pattern);
      }

      // Train and validate
      const result = await this.startTraining(patternName, trainingData, validationData);
      
      if (result.accuracy > bestAccuracy) {
        bestAccuracy = result.accuracy;
        bestThreshold = threshold;
      }
    }

    return {
      bestThreshold,
      bestAccuracy
    };
  }
} 