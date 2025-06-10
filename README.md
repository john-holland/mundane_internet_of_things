# Mundane Internet of Things

A cross-platform application that uses machine learning to detect patterns and enable smart features on everyday devices. The system can monitor various household appliances and devices using different types of sensors (audio, accelerometer, gyroscope, light) and provide notifications when specific patterns are detected.

## Features

- Cross-platform support (Electron, React Native, Web)
- Machine learning-based pattern detection
- Support for multiple sensor types:
  - Audio (for detecting appliance sounds)
  - Accelerometer (for vibration detection)
  - Gyroscope (for motion detection)
  - Light sensors (for ambient light monitoring)
- Real-time pattern recognition
- Customizable pattern training
- Notification system for detected events

## Supported Devices

- Dishwasher
- Kettle
- Plant light monitoring
- Washing machine
- Dryer
- And more through custom pattern training

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- For development:
  - TypeScript
  - Electron
  - React Native development environment

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mundane-internet-of-things.git
cd mundane-internet-of-things
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── services/
│   ├── MLService.ts      # Machine learning service
│   └── SensorService.ts  # Sensor data collection
├── components/           # React components
├── utils/               # Utility functions
└── types/              # TypeScript type definitions
```

## Usage

1. Start the application
2. Select the device you want to monitor
3. Choose the appropriate sensor type
4. Start monitoring
5. The application will notify you when the specified pattern is detected

## Development

### Adding New Patterns

1. Define the pattern in `MLService.ts`
2. Add appropriate sensor configuration
3. Train the model with sample data

### Building for Different Platforms

- Electron:
```bash
npm run build:electron
```

- React Native:
```bash
npm run build:react-native
```

- Web:
```bash
npm run build:web
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License - see LICENSE file for details

**Credits:**
This project benefited from AI code assistance by [Cursor](https://www.cursor.com/). 