import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { CONFIG } from '../config';
import { Device, SensorType } from '../types';

interface DeviceSettings {
  threshold?: number;
  enableNotifications?: boolean;
  sampleRate?: number;
}

interface SettingsState {
  [key: string]: DeviceSettings;
}

interface SettingsProps {
  storageService: StorageService;
  onSettingsChange: (settings: SettingsState) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  storageService,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<SettingsState>({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await storageService.getDeviceSettings('global');
    setSettings(savedSettings || {});
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
    loadDeviceSettings(deviceId);
  };

  const loadDeviceSettings = async (deviceId: string) => {
    const deviceSettings = await storageService.getDeviceSettings(deviceId);
    setSettings((prev: SettingsState) => ({
      ...prev,
      [deviceId]: deviceSettings || {}
    }));
  };

  const handleSettingChange = (key: keyof DeviceSettings, value: DeviceSettings[keyof DeviceSettings]) => {
    setSettings((prev: SettingsState) => ({
      ...prev,
      [selectedDevice]: {
        ...prev[selectedDevice],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    if (selectedDevice) {
      await storageService.saveDeviceSettings(selectedDevice, settings[selectedDevice]);
    }
    await storageService.saveDeviceSettings('global', settings);
    onSettingsChange(settings);
    setIsEditing(false);
  };

  const handleExport = async () => {
    const data = await storageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mundane-iot-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result as string;
        await storageService.importData(data);
        await loadSettings();
        onSettingsChange(settings);
      };
      reader.readAsText(file);
    }
  };

  const getDefaultSampleRate = (sensorType: SensorType): number => {
    switch (sensorType) {
      case 'audio':
        return CONFIG.sensors.audio.sampleRate;
      case 'accelerometer':
        return CONFIG.sensors.accelerometer.frequency;
      case 'gyroscope':
        return CONFIG.sensors.gyroscope.frequency;
      case 'light':
        return CONFIG.sensors.light.frequency;
      case 'camera':
        return 30; // Default camera frame rate
      default:
        return 60;
    }
  };

  const renderDeviceSettings = (device: Device) => {
    const deviceSettings = settings[device.id] || {};
    const defaultThreshold = 0.7;
    const defaultSampleRate = getDefaultSampleRate(device.sensorType);

    return (
      <div className="device-settings">
        <h3>{device.name} Settings</h3>
        
        <div className="setting-group">
          <label>
            Notification Threshold
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={deviceSettings.threshold ?? defaultThreshold}
              onChange={(e) => handleSettingChange('threshold', parseFloat(e.target.value))}
              disabled={!isEditing}
            />
          </label>
        </div>

        <div className="setting-group">
          <label>
            Enable Notifications
            <input
              type="checkbox"
              checked={deviceSettings.enableNotifications ?? true}
              onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
              disabled={!isEditing}
            />
          </label>
        </div>

        <div className="setting-group">
          <label>
            Sample Rate (Hz)
            <input
              type="number"
              min="1"
              max="100"
              value={deviceSettings.sampleRate ?? defaultSampleRate}
              onChange={(e) => handleSettingChange('sampleRate', parseInt(e.target.value))}
              disabled={!isEditing}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="settings">
      <h2>Settings</h2>

      <div className="settings-controls">
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}>Edit Settings</button>
        ) : (
          <div className="edit-controls">
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        )}
        
        <div className="import-export">
          <button onClick={handleExport}>Export Settings</button>
          <label className="import-button">
            Import Settings
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="device-list">
        {CONFIG.devices.map(device => (
          <button
            key={device.id}
            className={`device-button ${selectedDevice === device.id ? 'selected' : ''}`}
            onClick={() => handleDeviceSelect(device.id)}
          >
            {device.name}
          </button>
        ))}
      </div>

      {selectedDevice && renderDeviceSettings(CONFIG.devices.find(d => d.id === selectedDevice)!)}

      <style>{`
        .settings {
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .settings-controls {
          display: flex;
          justify-content: space-between;
          margin: 1rem 0;
        }

        .edit-controls {
          display: flex;
          gap: 1rem;
        }

        .import-export {
          display: flex;
          gap: 1rem;
        }

        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
        }

        .import-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background: #6c757d;
          color: white;
          cursor: pointer;
        }

        .device-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .device-button {
          background: #f8f9fa;
          color: #212529;
          border: 1px solid #dee2e6;
        }

        .device-button.selected {
          background: #e9ecef;
          border-color: #007bff;
        }

        .device-settings {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .setting-group {
          margin: 1rem 0;
        }

        label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        input[type="number"],
        input[type="checkbox"] {
          width: 100px;
          padding: 0.25rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
        }

        input:disabled {
          background: #e9ecef;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}; 