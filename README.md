# IoT Sensor Dashboard

A real-time IoT sensor monitoring system built with **Next.js** (Frontend), **Node.js** (Backend), **MQTT** (Message Broker), **Socket.io** (Real-time Communication), and **MongoDB** (Database).

## Architecture

```
┌─────────────────┐
│  IoT Sensors    │
│  (ESP32/Arduino)│
└────────┬────────┘
         │ MQTT Protocol
         ▼
┌─────────────────┐     ┌──────────────┐
│  MQTT Broker    │────▶│   MongoDB    │
│  (Aedes)        │     │   Database   │
└────────┬────────┘     └──────────────┘
         │ Socket.io
         ▼
┌─────────────────┐
│  Next.js        │
│  Dashboard      │
└─────────────────┘
```

### Components

1. **Backend (Node.js)**
   - Express.js server for REST API
   - Aedes MQTT broker (embedded)
   - Socket.io for real-time updates
   - MongoDB for data persistence

2. **Frontend (Next.js)**
   - Real-time dashboard with live charts
   - Socket.io client for instant updates
   - Responsive UI with Tailwind CSS
   - Recharts for data visualization

3. **IoT Sensors**
   - Publish data via MQTT protocol
   - Topic pattern: `home/sensors/[sensor-name]`
   - JSON payload format

## Prerequisites

- **Node.js** >= 18.x
- **pnpm** (recommended) or npm
- **MongoDB** (local or cloud)
  - Local: Install MongoDB Community Edition
  - Cloud: MongoDB Atlas (free tier available)

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd embedded-lab-proj
```

### 2. Install Dependencies

#### Backend

```bash
cd backend
pnpm install
```

#### Frontend

```bash
cd frontend
pnpm install
```

### 3. Configure Environment Variables

#### Backend Configuration

Create `backend/.env` from the example:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/iot-sensors

# Server Ports
PORT=4000
MQTT_PORT=1883

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration

Create `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 4. Start MongoDB

#### Option A: Local MongoDB

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `backend/.env`

### 5. Run the Application

#### Start Backend (Terminal 1)

```bash
cd backend
pnpm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 MQTT Broker running on port 1883
🚀 HTTP Server running on port 4000
```

#### Start Frontend (Terminal 2)

```bash
cd frontend
pnpm run dev
```

The dashboard will be available at: **http://localhost:3000**

## 📡 MQTT Configuration

### Topic Structure

The system subscribes to all topics under `home/sensors/#`

**Example topics:**
- `home/sensors/temperature`
- `home/sensors/humidity`
- `home/sensors/living-room`
- `home/sensors/bedroom/temp`

### Message Format

Sensors should publish JSON payloads:

```json
{
  "sensorId": "sensor-001",
  "temperature": 23.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "light": 450,
  "motion": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Supported fields:**
- `temperature` (number) - in Celsius
- `humidity` (number) - percentage
- `pressure` (number) - in hPa
- `light` (number) - in lux
- `motion` (boolean) - motion detected
- `sensorId` (string) - unique sensor identifier
- `timestamp` (string) - ISO 8601 format

## 🧪 Testing with MQTT

### Using MQTT CLI Tool (mosquitto_pub)

Install mosquitto clients:

```bash
# macOS
brew install mosquitto

# Ubuntu/Debian
sudo apt-get install mosquitto-clients

# Windows
# Download from https://mosquitto.org/download/
```

Publish test data:

```bash
# Single sensor reading
mosquitto_pub -h localhost -p 1883 -t "home/sensors/test" -m '{"sensorId":"test-001","temperature":23.5,"humidity":65.2}'

# Multiple readings
mosquitto_pub -h localhost -p 1883 -t "home/sensors/living-room" -m '{"temperature":22.0,"humidity":60.0,"light":300}'

mosquitto_pub -h localhost -p 1883 -t "home/sensors/bedroom" -m '{"temperature":21.5,"humidity":55.0,"motion":true}'
```

### Using MQTT.js (Node.js)

Create a test publisher:

```javascript
// test-publisher.js
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Publish random sensor data every 5 seconds
  setInterval(() => {
    const data = {
      sensorId: 'test-sensor',
      temperature: (20 + Math.random() * 10).toFixed(2),
      humidity: (50 + Math.random() * 30).toFixed(2),
      pressure: (1000 + Math.random() * 50).toFixed(2),
      timestamp: new Date().toISOString()
    };
    
    client.publish('home/sensors/test', JSON.stringify(data));
    console.log('Published:', data);
  }, 5000);
});
```

Run it:

```bash
npm install mqtt
node test-publisher.js
```

### Using Python (paho-mqtt)

```python
import paho.mqtt.client as mqtt
import json
import time
import random

client = mqtt.Client()
client.connect("localhost", 1883, 60)

while True:
    data = {
        "sensorId": "python-sensor",
        "temperature": round(20 + random.random() * 10, 2),
        "humidity": round(50 + random.random() * 30, 2),
        "pressure": round(1000 + random.random() * 50, 2)
    }
    
    client.publish("home/sensors/python", json.dumps(data))
    print(f"Published: {data}")
    time.sleep(5)
```

## 🔌 REST API Endpoints

### Health Check

```bash
GET http://localhost:4000/
```

### Get All Sensor Data (Paginated)

```bash
GET http://localhost:4000/api/sensors?page=1&limit=50
```

### Get Data by Topic

```bash
GET http://localhost:4000/api/sensors/topic/temperature?limit=100
```

### Get Latest Readings

```bash
GET http://localhost:4000/api/sensors/latest
```

### Get Statistics

```bash
GET http://localhost:4000/api/sensors/stats
```

### Cleanup Old Data

```bash
DELETE http://localhost:4000/api/sensors/cleanup?days=30
```

## 📊 Features

### Real-time Dashboard
- ✅ Live sensor data cards
- ✅ Automatic updates via Socket.io
- ✅ Connection status indicator
- ✅ Multiple sensor support

### Data Visualization
- ✅ Time-series charts (Recharts)
- ✅ Temperature, Humidity, Pressure, Light
- ✅ Last 50 data points displayed
- ✅ Interactive tooltips

### Backend Features
- ✅ Embedded MQTT broker (no external broker needed)
- ✅ MongoDB data persistence
- ✅ RESTful API
- ✅ Real-time WebSocket updates
- ✅ Automatic data cleanup

### Developer Experience
- ✅ TypeScript support
- ✅ Hot reload (nodemon + Next.js)
- ✅ Tailwind CSS for styling
- ✅ Dark mode support
- ✅ Environment configuration

## 🛠️ Development

### Project Structure

```
embedded-lab-proj/
├── backend/
│   ├── server.js          # Main backend server
│   ├── package.json       # Backend dependencies
│   └── .env               # Backend configuration
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Main dashboard
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   ├── SensorCard.tsx # Sensor display card
│   │   └── SensorChart.tsx # Chart component
│   ├── lib/
│   │   └── useSocket.ts   # Socket.io hook
│   └── package.json       # Frontend dependencies
│
└── README.md
```

### Available Scripts

#### Backend

```bash
pnpm run dev      # Development with nodemon
pnpm run start    # Production mode
```

#### Frontend

```bash
pnpm run dev      # Development mode
pnpm run build    # Production build
pnpm run start    # Production server
```

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoNetworkError: failed to connect`

**Solution:**
1. Check if MongoDB is running: `mongosh`
2. Verify connection string in `.env`
3. For Atlas: Check network access whitelist

### MQTT Connection Issues

**Error:** Sensors can't connect to MQTT broker

**Solution:**
1. Check if backend is running on port 1883
2. Verify firewall settings
3. Test with mosquitto_sub: `mosquitto_sub -h localhost -p 1883 -t "home/sensors/#"`

### Frontend Can't Connect to Backend

**Error:** Socket.io connection failed

**Solution:**
1. Verify backend is running on port 4000
2. Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
3. Check CORS settings in `backend/server.js`

### No Data Showing on Dashboard

**Solution:**
1. Check backend logs for MQTT messages
2. Verify sensor data format matches expected JSON
3. Use test publisher to send sample data
4. Check MongoDB for stored data: `mongosh iot-sensors`

## Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set environment variables
2. Use external MongoDB (Atlas recommended)
3. Update MQTT_PORT if needed
4. Deploy with `pnpm run start`

### Frontend Deployment (Vercel/Netlify)

1. Build: `pnpm run build`
2. Set `NEXT_PUBLIC_SOCKET_URL` to your backend URL
3. Deploy static files

### Using External MQTT Broker

If you prefer using Mosquitto or HiveMQ instead of Aedes:

1. Install Mosquitto: `brew install mosquitto`
2. Start broker: `mosquitto -p 1883`
3. Update backend to connect as MQTT client instead of running broker

## License

MIT License - feel free to use this project for learning and development.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

---
