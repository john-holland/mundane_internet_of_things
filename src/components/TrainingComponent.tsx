import React, { useState, useEffect } from 'react';
import { TrainingService, TrainingResult } from '../services/TrainingService';
import { SensorData } from '../types';
import { CONFIG } from '../config';

interface TrainingComponentProps {
  trainingService: TrainingService;
  deviceId: string;
  onTrainingComplete: (result: TrainingResult) => void;
}

export const TrainingComponent: React.FC<TrainingComponentProps> = ({
  trainingService,
  deviceId,
  onTrainingComplete
}) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [trainingData, setTrainingData] = useState<SensorData[]>([]);
  const [validationData, setValidationData] = useState<SensorData[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [results, setResults] = useState<TrainingResult | null>(null);

  const device = CONFIG.devices.find(d => d.id === deviceId);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCollecting) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1;
          if (newProgress >= 100) {
            setIsCollecting(false);
            return 100;
          }
          return newProgress;
        });
      }, 300); // 30 seconds total = 300ms per 1%
    }
    return () => clearInterval(interval);
  }, [isCollecting]);

  const handleStartCollection = async () => {
    setIsCollecting(true);
    setProgress(0);
    setStatus('Collecting training data...');
    
    try {
      const data = await trainingService.collectTrainingData(deviceId);
      setTrainingData(data);
      setStatus('Training data collected successfully');
    } catch (error) {
      setStatus(`Error collecting data: ${error.message}`);
    } finally {
      setIsCollecting(false);
    }
  };

  const handleStartValidation = async () => {
    setIsCollecting(true);
    setProgress(0);
    setStatus('Collecting validation data...');
    
    try {
      const data = await trainingService.collectTrainingData(deviceId);
      setValidationData(data);
      setStatus('Validation data collected successfully');
    } catch (error) {
      setStatus(`Error collecting validation data: ${error.message}`);
    } finally {
      setIsCollecting(false);
    }
  };

  const handleStartTraining = async () => {
    if (trainingData.length === 0) {
      setStatus('Please collect training data first');
      return;
    }

    setIsTraining(true);
    setStatus('Training model...');
    
    try {
      const result = await trainingService.startTraining(
        deviceId,
        trainingData,
        validationData
      );
      setResults(result);
      onTrainingComplete(result);
      setStatus('Training completed successfully');
    } catch (error) {
      setStatus(`Error during training: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const handleOptimize = async () => {
    if (trainingData.length === 0 || validationData.length === 0) {
      setStatus('Please collect both training and validation data first');
      return;
    }

    setIsTraining(true);
    setStatus('Optimizing model...');
    
    try {
      const { bestThreshold, bestAccuracy } = await trainingService.optimizeModel(
        deviceId,
        trainingData,
        validationData
      );
      setStatus(`Optimization complete. Best threshold: ${bestThreshold}, Accuracy: ${bestAccuracy}`);
    } catch (error) {
      setStatus(`Error during optimization: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="training-component">
      <h2>Train {device?.name}</h2>
      
      <div className="training-controls">
        <button
          onClick={handleStartCollection}
          disabled={isCollecting || isTraining}
        >
          Collect Training Data
        </button>
        
        <button
          onClick={handleStartValidation}
          disabled={isCollecting || isTraining}
        >
          Collect Validation Data
        </button>
        
        <button
          onClick={handleStartTraining}
          disabled={isCollecting || isTraining || trainingData.length === 0}
        >
          Start Training
        </button>
        
        <button
          onClick={handleOptimize}
          disabled={isCollecting || isTraining || trainingData.length === 0 || validationData.length === 0}
        >
          Optimize Model
        </button>
      </div>

      {isCollecting && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span className="progress-text">{progress}%</span>
        </div>
      )}

      <div className="status">
        <p>{status}</p>
      </div>

      {results && (
        <div className="results">
          <h3>Training Results</h3>
          <p>Accuracy: {Math.round(results.accuracy * 100)}%</p>
          <p>Samples: {results.samples}</p>
          <p>Features: {results.features.length}</p>
          <p>Timestamp: {new Date(results.timestamp).toLocaleString()}</p>
        </div>
      )}

      <style jsx>{`
        .training-component {
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .training-controls {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
        }

        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background: #eee;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          margin: 1rem 0;
        }

        .progress-fill {
          height: 100%;
          background: #28a745;
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #000;
          font-weight: bold;
        }

        .status {
          margin: 1rem 0;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .results {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .results h3 {
          margin-top: 0;
        }
      `}</style>
    </div>
  );
}; 