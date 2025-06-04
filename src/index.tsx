import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { MLService } from './services/MLService';
import { SensorService } from './services/SensorService';

// Initialize services
const mlService = new MLService();
const sensorService = new SensorService();

// Initialize services
Promise.all([
  mlService.initialize(),
  sensorService.initialize()
]).then(() => {
  ReactDOM.render(
    <React.StrictMode>
      <App mlService={mlService} sensorService={sensorService} />
    </React.StrictMode>,
    document.getElementById('root')
  );
}).catch(error => {
  console.error('Failed to initialize services:', error);
}); 