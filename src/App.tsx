import React, { useState, useEffect } from 'react';
import { MLService } from './services/MLService';
import { SensorService, SensorConfig } from './services/SensorService';
import { SensorData } from './services/MLService';

interface AppProps {
  mlService: MLService;
  sensorService: SensorService;
}

export const App: React.FC<AppProps> = ({ mlService, sensorService }) => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectedPatterns, setDetectedPatterns] = useState<Map<string, number>>(new Map());
  const [sensorStatus, setSensorStatus] = useState<Map<string, boolean>>(new Map());

  const devices = [
    { id: 'dishwasher', name: 'Dishwasher', sensorType: 'audio' },
    { id: 'kettle', name: 'Kettle', sensorType: 'audio' },
    { id: 'plant_light', name: 'Plant Light', sensorType: 'light' },
    { id: 'washer', name: 'Washing Machine', sensorType: 'accelerometer' },
    { id: 'dryer', name: 'Dryer', sensorType: 'accelerometer' }
  ];

  useEffect(() => {
    // Set up sensor data handler
    const handleSensorData = async (data: SensorData) => {
      const patterns = await mlService.processSensorData(data);
      setDetectedPatterns(patterns);
    };

    // Subscribe to sensor data
    sensorService.onSensorData = handleSensorData;

    return () => {
      sensorService.cleanup();
    };
  }, [mlService, sensorService]);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      sensorService.startSensor(device.sensorType as SensorData['type']);
      setSensorStatus(prev => new Map(prev).set(device.sensorType, true));
    }
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    sensorService.cleanup();
    setSensorStatus(new Map());
  };

  return (
    <div className="app">
      <header>
        <h1>Mundane Internet of Things</h1>
      </header>

      <main>
        <section className="device-selection">
          <h2>Select Device to Monitor</h2>
          <div className="device-grid">
            {devices.map(device => (
              <button
                key={device.id}
                className={`device-button ${selectedDevice === device.id ? 'selected' : ''}`}
                onClick={() => handleDeviceSelect(device.id)}
              >
                {device.name}
              </button>
            ))}
          </div>
        </section>

        <section className="monitoring-controls">
          <h2>Monitoring Controls</h2>
          {selectedDevice ? (
            <div className="controls">
              {!isMonitoring ? (
                <button
                  className="start-button"
                  onClick={handleStartMonitoring}
                >
                  Start Monitoring
                </button>
              ) : (
                <button
                  className="stop-button"
                  onClick={handleStopMonitoring}
                >
                  Stop Monitoring
                </button>
              )}
            </div>
          ) : (
            <p>Please select a device to monitor</p>
          )}
        </section>

        <section className="detection-results">
          <h2>Detection Results</h2>
          {isMonitoring && (
            <div className="results">
              {Array.from(detectedPatterns.entries()).map(([pattern, confidence]) => (
                <div key={pattern} className="pattern-result">
                  <span className="pattern-name">{pattern}</span>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span className="confidence-value">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .device-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .device-button {
          padding: 1rem;
          border: 2px solid #ccc;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .device-button.selected {
          border-color: #007bff;
          background: #e6f3ff;
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .start-button,
        .stop-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .start-button {
          background: #28a745;
          color: white;
        }

        .stop-button {
          background: #dc3545;
          color: white;
        }

        .pattern-result {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          gap: 1rem;
        }

        .confidence-bar {
          flex: 1;
          height: 20px;
          background: #eee;
          border-radius: 10px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: #007bff;
          transition: width 0.3s ease;
        }

        .confidence-value {
          min-width: 60px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}; 