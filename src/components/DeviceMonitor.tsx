import React, { useEffect, useState } from 'react';
import { MLService } from '../services/MLService';
import { SensorService } from '../services/SensorService';
import { Device, SensorData } from '../types';

interface DeviceMonitorProps {
  device: Device;
  onPatternDetected: (pattern: string, confidence: number) => void;
}

interface DetectionResult {
  pattern: string;
  confidence: number;
}

export const DeviceMonitor: React.FC<DeviceMonitorProps> = ({ device, onPatternDetected }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mlService = new MLService();
  const sensorService = new SensorService();

  useEffect(() => {
    if (isMonitoring) {
      sensorService.onSensorData = async (data: SensorData) => {
        const result = await mlService.processSensorData(data);
        const pattern = Array.from(result.keys())[0];
        const confidence = result.get(pattern) || 0;
        
        if (confidence > device.threshold) {
          const detection = { pattern, confidence };
          setLastDetection(detection);
          onPatternDetected(detection.pattern, detection.confidence);

          // Get audio buffer if available
          const audioBuffer = mlService.getAudioBuffer(pattern);
          if (audioBuffer) {
            const url = URL.createObjectURL(audioBuffer);
            setAudioUrl(url);
          }
        }
      };

      sensorService.startSensor(device.sensorType);
    }

    return () => {
      if (isMonitoring) {
        sensorService.cleanup();
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      }
    };
  }, [isMonitoring, device]);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    setLastDetection(null);
    setAudioUrl(null);
  };

  return (
    <div className="device-monitor">
      <h3>{device.name}</h3>
      <div className="monitor-controls">
        {!isMonitoring ? (
          <button onClick={handleStartMonitoring}>Start Monitoring</button>
        ) : (
          <button onClick={handleStopMonitoring}>Stop Monitoring</button>
        )}
      </div>
      {lastDetection && (
        <div className="detection-info">
          <p>Pattern: {lastDetection.pattern}</p>
          <p>Confidence: {(lastDetection.confidence * 100).toFixed(1)}%</p>
          {audioUrl && (
            <div className="audio-playback">
              <audio controls src={audioUrl} />
              <a href={audioUrl} download={`${lastDetection.pattern}_${Date.now()}.wav`}>
                Download Recording
              </a>
            </div>
          )}
        </div>
      )}
      <style>{`
        .device-monitor {
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        .monitor-controls {
          margin: 1rem 0;
        }
        .detection-info {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        .audio-playback {
          margin-top: 1rem;
        }
        button {
          padding: 0.5rem 1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
}; 