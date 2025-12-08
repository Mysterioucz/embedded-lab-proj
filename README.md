# IoT Sensor Dashboard

A real-time IoT sensor monitoring system built with **Next.js** (Frontend), **Node.js** (Backend), **MQTT** (Message Broker), **Socket.io** (Real-time Communication), and **MongoDB** (Database).

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         IoT Sensor System                             │
│                                                                        │
│  ┌────────────────┐                                                   │
│  │  STM32 F411RE  │  UART (115200 baud)                              │
│  │  Nucleo Board  │  ──────────────────┐                             │
│  │                │                     │                             │
│  │  - DHT11       │                     ▼                             │
│  │  - LDR + ADC   │              ┌─────────────┐                     │
│  │  - DS1302 RTC  │              │   ESP32-S3  │                     │
│  │  - USART1/2    │              │   WiFi      │                     │
│  └────────────────┘              │   Bridge    │                     │
│         │                         └──────┬──────┘                     │
│         │ USB (Debug)                    │                            │
│         ▼                                │ MQTT/WiFi                  │
│  ┌────────────┐                          │ (mqtt://server:1883)      │
│  │   PC/USB   │                          │                            │
│  │   Debug    │                          ▼                            │
│  └────────────┘              ┌────────────────────┐                  │
│                               │  Backend Server    │                  │
│                               │  (Node.js/Express) │                  │
│                               │                    │                  │
│                               │  - MQTT Broker     │◄──┐              │
│                               │    (Aedes/Railway) │   │              │
│                               │  - Socket.io       │   │              │
│                               │  - REST API        │   │              │
│                               └────────┬───────────┘   │              │
│                                        │               │              │
│                                        │ Saves         │ Queries      │
│                                        ▼               │              │
│                               ┌────────────────────┐   │              │
│                               │     MongoDB        │   │              │
│                               │     Database       │───┘              │
│                               └────────────────────┘                  │
│                                        │                               │
│                                        │ Real-time via Socket.io      │
│                                        ▼                               │
│                               ┌────────────────────┐                  │
│                               │  Frontend          │                  │
│                               │  (Next.js)         │                  │
│                               │                    │                  │
│                               │  - Dashboard       │                  │
│                               │  - Live Charts     │                  │
│                               │  - WebSocket       │                  │
│                               └────────────────────┘                  │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Components

1. **STM32 F411RE Nucleo Board (MCU)**
   - **Microcontroller**: STM32F411RET6 (ARM Cortex-M4, 84MHz)
   - **Sensors**:
     - DHT11: Temperature & Humidity sensor
     - LDR (Light Dependent Resistor): Light intensity via ADC
     - DS1302: Real-time clock module
   - **Communication**:
     - USART1 (PA9/PA10): Serial to ESP32 @ 115200 baud
     - USART2 (PA2/PA3): USB Debug console @ 115200 baud
   - **Functions**: Read sensors, format JSON, transmit data every 2 seconds

2. **ESP32-S3 WiFi Bridge**
   - **Role**: UART-to-MQTT bridge
   - **WiFi**: 2.4GHz IEEE 802.11 b/g/n
   - **Communication**:
     - UART2 (GPIO18/17): Serial from STM32 @ 115200 baud
     - MQTT Client: Publishes to cloud broker
   - **Features**:
     - Automatic WiFi reconnection
     - MQTT connection management
     - JSON validation and forwarding
     - Error handling and watchdog timer
     - Connection status LED

3. **Backend Server (Node.js)**
   - **Framework**: Express.js REST API server
   - **MQTT Broker**: Aedes (embedded) or external (Railway/Mosquitto)
   - **Real-time**: Socket.io for WebSocket communication
   - **Database**: MongoDB for data persistence
   - **Services**:
     - MQTT message processing
     - WebSocket broadcasting
     - REST API endpoints
     - Data validation and storage

4. **Frontend Dashboard (Next.js)**
   - **Framework**: Next.js 14 with React
   - **UI**: Tailwind CSS, responsive design
   - **Visualization**: Recharts for time-series data
   - **Real-time**: Socket.io client for live updates
   - **Features**:
     - Live sensor cards
     - Historical data charts
     - Connection status monitoring
     - Multi-sensor support

## PIN Mapping

### STM32 F411RE Nucleo Board

#### Power Pins
- **3.3V**: Power supply for sensors (DHT11, DS1302)
- **5V**: Available from USB (not used in this project)
- **GND**: Common ground for all components

#### DHT11 Temperature & Humidity Sensor
| DHT11 Pin | STM32 Pin | Function | Notes |
|-----------|-----------|----------|-------|
| VCC | 3.3V | Power | 3.3V-5V compatible |
| DATA | **PB5** | Data I/O | Digital bidirectional |
| GND | GND | Ground | - |

**Configuration**: GPIO with software bit-banging protocol

#### LDR (Light Sensor) Circuit
| Component | STM32 Pin | Function | Notes |
|-----------|-----------|----------|-------|
| LDR + Divider | **PA0** | ADC Input | ADC1_IN0 Channel |
| Circuit | - | Voltage divider | LDR + 10kΩ resistor |

**Configuration**: 
- ADC1, Channel 0
- 12-bit resolution (0-4095)
- Sampling time: 3 cycles
- Voltage range: 0-3.3V
- **Lux Calculation**: `Lux = 10 × (R/50000)^(-1/0.7)` where R = 10kΩ × (3.3V - V) / V

#### DS1302 Real-Time Clock Module
| DS1302 Pin | STM32 Pin | Function | Notes |
|-----------|-----------|----------|-------|
| VCC | 3.3V | Power | - |
| GND | GND | Ground | - |
| CLK (SCLK) | **PB8** | Serial Clock | GPIO Output |
| DAT (I/O) | **PB4** | Data I/O | GPIO bidirectional |
| RST (CE) | **PB10** | Chip Enable | GPIO Output |

**Configuration**: Software SPI (bit-banging), 3-wire interface

#### USART1 - ESP32 Communication
| Function | STM32 Pin | Connected To | Baud Rate |
|----------|-----------|--------------|-----------|
| TX | **PA9** | ESP32 RX (GPIO18) | 115200 |
| RX | **PA10** | ESP32 TX (GPIO17) | 115200 |
| GND | GND | ESP32 GND | - |

**Configuration**: Asynchronous mode, 8N1 (8 data bits, no parity, 1 stop bit)

#### USART2 - USB Debug Console
| Function | STM32 Pin | Connected To | Baud Rate |
|----------|-----------|--------------|-----------|
| TX | **PA2** | ST-Link USB | 115200 |
| RX | **PA3** | ST-Link USB | 115200 |

**Configuration**: Connected to ST-Link virtual COM port for debugging

#### Status LED
| Component | STM32 Pin | Function | Notes |
|-----------|-----------|----------|-------|
| Green LED (LD2) | **PA5** | Status indicator | Built-in LED, toggles every 2s |

#### Debug Pins (SWD)
| Function | STM32 Pin | Purpose |
|----------|-----------|---------|
| SWDIO | **PA13** | Debug data |
| SWCLK | **PA14** | Debug clock |
| SWO | **PB3** | Serial wire output |

### ESP32-S3 WiFi Bridge

#### UART2 - STM32 Communication
| Function | ESP32 Pin | Connected To | Baud Rate |
|----------|-----------|--------------|-----------|
| RX | **GPIO18** (RXD2) | STM32 TX (PA9) | 115200 |
| TX | **GPIO17** (TXD2) | STM32 RX (PA10) | 115200 |
| GND | GND | STM32 GND | - |

**Configuration**: Serial2, 8N1, 512-byte buffer

#### Status LED
| Component | ESP32 Pin | Function | Pattern |
|-----------|-----------|----------|---------|
| Built-in LED | **GPIO2** | Connection status | Blink pattern indicates WiFi/MQTT status |

**LED Patterns**:
- Fast blink (200ms): WiFi connecting
- Medium blink (500ms): WiFi connected, MQTT connecting
- Slow blink (1000ms): Fully connected
- Solid ON: Error state
- OFF: Disconnected

#### Power
- **VIN/5V**: 5V power input (USB or external)
- **3.3V**: 3.3V regulated output
- **GND**: Ground

## Data Flow

### Complete Data Pipeline

```
1. STM32 Sensor Reading (Every 2 seconds)
   ├─ DHT11: Read temperature & humidity
   ├─ ADC: Read LDR light intensity
   └─ DS1302: Read current timestamp

2. STM32 Data Processing
   ├─ Convert ADC value to Lux
   ├─ Format data as JSON string
   └─ Calculate checksum for DHT11

3. STM32 Transmission
   ├─ USART2 → PC/Debug console (monitoring)
   └─ USART1 → ESP32 (main data path)

4. ESP32 Reception (UART2)
   ├─ Receive JSON string from STM32
   ├─ Validate JSON format
   └─ Buffer data (max 512 bytes)

5. ESP32 Processing
   ├─ Parse JSON with ArduinoJson
   ├─ Validate data fields
   ├─ Add sensor metadata
   └─ Handle errors with watchdog

6. ESP32 WiFi/MQTT Publishing
   ├─ Ensure WiFi connection (auto-reconnect)
   ├─ Ensure MQTT connection (retry logic)
   ├─ Publish to topic: "home/sensors/esp32"
   └─ Update LED status

7. Backend MQTT Broker
   ├─ Receive MQTT message on subscribed topic
   ├─ Parse timestamp (DD/MM/YYYY HH:MM:SS format)
   └─ Log reception

8. Backend Processing
   ├─ Validate JSON structure
   ├─ Parse STM32 timestamp format
   ├─ Map fields: temp→temperature, hum→humidity, lux→light
   └─ Create SensorData document

9. Backend Storage
   ├─ Save to MongoDB with schema:
   │  {
   │    topic: "home/sensors/esp32",
   │    sensorId: "nucleo-f411re-001",
   │    temperature: 25.5,
   │    humidity: 60.0,
   │    light: 450.0,
   │    timestamp: ISODate("2025-12-08T11:40:00.000Z")
   │  }
   └─ Confirm save to database

10. Backend Broadcasting
    ├─ Emit Socket.io event: "sensor-data"
    ├─ Send to all connected WebSocket clients
    └─ Include topic and full data object

11. Frontend Reception
    ├─ Socket.io client receives "sensor-data" event
    ├─ Update React state (sensorData array)
    └─ Trigger UI re-render

12. Frontend Display
    ├─ Group data by topic
    ├─ Display latest values in sensor cards
    ├─ Update time-series charts (last 50 points)
    └─ Show connection status indicator
```

### JSON Data Format

#### From STM32 to ESP32
```json
{
  "temp": 25.5,
  "hum": 60.0,
  "lux": 450.0,
  "time": "08/12/2024 11:40:00"
}
```

#### From ESP32 to MQTT Broker
```json
{
  "temp": 25.5,
  "hum": 60.0,
  "lux": 450.0,
  "time": "08/12/2024 11:40:00"
}
```
*Note: ESP32 forwards the exact JSON from STM32*

#### Stored in MongoDB
```json
{
  "_id": ObjectId("..."),
  "topic": "home/sensors/esp32",
  "sensorId": "nucleo-f411re-001",
  "temperature": 25.5,
  "humidity": 60.0,
  "light": 450.0,
  "timestamp": ISODate("2024-12-08T11:40:00.000Z"),
  "createdAt": ISODate("2024-12-08T11:40:01.234Z")
}
```

#### Broadcast to Frontend
```json
{
  "topic": "home/sensors/esp32",
  "data": {
    "_id": "...",
    "topic": "home/sensors/esp32",
    "sensorId": "nucleo-f411re-001",
    "temperature": 25.5,
    "humidity": 60.0,
    "light": 450.0,
    "timestamp": "2024-12-08T11:40:00.000Z"
  }
}
```

### Communication Protocols

1. **UART (STM32 ↔ ESP32)**
   - Protocol: RS-232 Serial
   - Baud Rate: 115200 bps
   - Format: 8 data bits, No parity, 1 stop bit (8N1)
   - Flow Control: None
   - Data Format: JSON strings terminated with `\r\n`

2. **WiFi (ESP32 ↔ Backend)**
   - Standard: IEEE 802.11 b/g/n (2.4GHz)
   - Protocol: TCP/IP
   - Connection: DHCP client

3. **MQTT (ESP32 ↔ Broker)**
   - Protocol Version: MQTT v3.1.1
   - Transport: TCP
   - Port: 1883 (default) or custom (Railway: 17647)
   - QoS: 0 (At most once delivery)
   - Authentication: Username/Password (configurable)
   - Keep-alive: 60 seconds

4. **WebSocket (Backend ↔ Frontend)**
   - Protocol: Socket.io over WebSocket/HTTP
   - Port: 4000 (default)
   - Transport: WebSocket with fallback to polling
   - Events: 
     - `sensor-data`: Real-time sensor updates
     - `connect`: Client connection
     - `disconnect`: Client disconnection

5. **HTTP REST API (Frontend ↔ Backend)**
   - Protocol: HTTP/1.1
   - Port: 4000
   - Format: JSON
   - Endpoints:
     - `GET /api/sensors`: Get all sensor data
     - `GET /api/sensors/latest`: Get latest readings
     - `GET /api/sensors/topic/:topic`: Get data by topic
     - `GET /api/sensors/stats`: Get statistics

### Timing & Performance

- **STM32 Sensor Reading**: 2 seconds interval
- **UART Transmission**: ~50ms per JSON packet
- **MQTT Publish**: ~100-300ms (network dependent)
- **Database Write**: ~10-50ms
- **Frontend Update**: Real-time (<100ms from broadcast)
- **End-to-End Latency**: ~500ms-1s (sensor to dashboard)

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
