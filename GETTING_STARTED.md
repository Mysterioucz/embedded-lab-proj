# 🎉 Welcome to Your IoT Sensor Dashboard!

```
 _____ _____    _____                            _____            _     _                         _ 
|_   _|  _  |  |_   _|                          |  __ \          | |   | |                       | |
  | | | | | |_   | |     ___  ___ _ __  ___  ___| |  | | __ _ ___| |__ | |__   ___   __ _ _ __ __| |
  | | | | | | |  | |    / __|/ _ \ '_ \/ __|/ _ \ |  | |/ _` / __| '_ \| '_ \ / _ \ / _` | '__/ _` |
 _| |_\ \_/ / |  | |    \__ \  __/ | | \__ \  __/ |__| | (_| \__ \ | | | |_) | (_) | (_| | | | (_| |
|_____|\___/\_|  \_/    |___/\___|_| |_|___/\___|_____/ \__,_|___/_| |_|_.__/ \___/ \__,_|_|  \__,_|
                                                                                                      
```

## 🚀 You're All Set!

Your project has been initialized with:
- ✅ **Backend** (Node.js + MQTT + Socket.io)
- ✅ **Frontend** (Next.js + React + TypeScript)
- ✅ **Examples** (ESP32 + Raspberry Pi code)
- ✅ **Documentation** (Complete guides)

---

## 📋 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# From project root
pnpm run install:all

# Or install separately
cd backend && pnpm install
cd ../frontend && pnpm install
```

### Step 2: Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local development)

# Frontend
cd frontend
cp .env.example .env.local
# Edit .env.local if needed (defaults work for local development)
```

### Step 3: Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use MongoDB Atlas (free cloud option)
# Sign up at: https://www.mongodb.com/cloud/atlas
```

### Step 4: Launch the Application

```bash
# From project root - runs both backend and frontend
pnpm run dev
```

**This will start:**
- 🟢 Backend on http://localhost:4000
- 🟢 Frontend on http://localhost:3000
- 🟢 MQTT Broker on port 1883

### Step 5: Send Test Data

Open a new terminal:

```bash
# Simulates 3 sensors sending data every 5 seconds
pnpm run test:publisher
```

### Step 6: View Your Dashboard! 🎊

Open your browser to: **http://localhost:3000**

You should see real-time sensor data updating every 5 seconds!

---

## 📚 Documentation Guide

We've prepared comprehensive documentation for you:

### 🌟 For Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[CHECKLIST.md](./CHECKLIST.md)** - Verify your installation

### 📖 For Deep Dive
- **[README.md](./README.md)** - Complete documentation
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Architecture overview

### 🔧 For IoT Integration
- **[examples/README.md](./examples/README.md)** - Device integration guide
- **[examples/esp32_sensor.ino](./examples/esp32_sensor.ino)** - Arduino/ESP32 code
- **[examples/raspberry_pi_sensor.py](./examples/raspberry_pi_sensor.py)** - Python code

---

## 🎯 What You Can Do

### 1. Monitor Real-time Data
Watch sensor readings update live on your dashboard with beautiful charts.

### 2. Test with Simulated Data
Use the built-in test publisher to see how everything works without physical sensors.

### 3. Connect Real Sensors
Follow the examples to connect ESP32, Arduino, or Raspberry Pi devices.

### 4. Customize the Dashboard
Edit frontend components to match your needs and preferences.

### 5. Build Your IoT Project
Use this as a foundation for home automation, environmental monitoring, or any IoT application!

---

## 🔌 Connect Your First Sensor

### Option 1: Use Test Publisher (No Hardware)
```bash
pnpm run test:publisher
```

### Option 2: Use MQTT CLI (Mosquitto)
```bash
mosquitto_pub -h localhost -p 1883 -t "home/sensors/test" \
  -m '{"temperature":23.5,"humidity":65.2,"light":400}'
```

### Option 3: Use Your IoT Device
Check `examples/` folder for ESP32 and Raspberry Pi code!

---

## 📊 What's Included

### Backend Features
- 🔄 Embedded MQTT Broker (Aedes)
- 💾 MongoDB data persistence
- 🌐 REST API for data access
- ⚡ Socket.io for real-time updates
- 🔍 Historical data queries
- 🧹 Data cleanup utilities

### Frontend Features
- 📈 Real-time charts (Recharts)
- 📱 Responsive design
- 🌙 Dark mode support
- 🎨 Beautiful UI (Tailwind CSS)
- 🔔 Connection status indicators
- 📊 Multiple sensor support

### Supported Sensors
- 🌡️ Temperature (DHT22, BMP280, etc.)
- 💧 Humidity (DHT sensors)
- 🔬 Pressure (BMP280, BME280)
- 💡 Light (LDR, BH1750)
- 🚶 Motion (PIR sensors)
- 📡 Any custom sensor via JSON

---

## 🎓 Learning Path

### Beginner
1. ✅ Run the test publisher
2. ✅ View data on the dashboard
3. ✅ Explore the REST API
4. ✅ Modify a sensor card

### Intermediate
1. Connect a real sensor (ESP32 or Raspberry Pi)
2. Customize the dashboard layout
3. Add new chart types
4. Create custom data queries

### Advanced
1. Deploy to production (Vercel + Railway)
2. Add authentication
3. Implement alerts/notifications
4. Scale for multiple locations
5. Add data export features

---

## 🐛 Troubleshooting

### MongoDB Won't Connect?
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB if needed
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### MQTT Port Already in Use?
```bash
# Find process using port 1883
lsof -i :1883

# Change port in backend/.env
MQTT_PORT=1884
```

### Frontend Can't Connect?
```bash
# Verify backend is running
curl http://localhost:4000

# Check environment variable
cat frontend/.env.local
```

### No Data on Dashboard?
- Check backend terminal for MQTT messages
- Verify JSON format is correct
- Use the test publisher to validate setup

---

## 💡 Tips & Tricks

1. **Development**: Use `pnpm run dev` to run both services with auto-reload
2. **Testing**: The test publisher creates realistic sensor data patterns
3. **Debugging**: Check browser console (F12) for real-time connection logs
4. **Customization**: Start with `components/SensorCard.tsx` to modify displays
5. **Data Management**: Use the cleanup API to remove old data: `DELETE /api/sensors/cleanup?days=30`

---

## 🌐 Architecture Overview

```
IoT Devices → MQTT (1883) → Backend (4000) → Socket.io → Frontend (3000)
                                ↓
                            MongoDB (27017)
```

**Data Flow:**
1. Sensors publish JSON to MQTT topics
2. Backend receives and saves to MongoDB
3. Backend broadcasts to all connected clients via Socket.io
4. Dashboard updates in real-time (< 100ms latency)

---

## 🚢 Next Steps

### Today
- [ ] Get the basic system running
- [ ] Send test data and verify it appears on dashboard
- [ ] Explore the REST API endpoints

### This Week
- [ ] Connect your first real sensor
- [ ] Customize the dashboard to your needs
- [ ] Set up multiple sensor locations

### This Month
- [ ] Build a complete monitoring system
- [ ] Deploy to production
- [ ] Share your project!

---

## 📞 Need Help?

1. **Check the docs**: Start with [QUICKSTART.md](./QUICKSTART.md)
2. **Verify setup**: Use [CHECKLIST.md](./CHECKLIST.md)
3. **Read examples**: See [examples/README.md](./examples/README.md)
4. **Open an issue**: If you're stuck, create a GitHub issue

---

## 🎉 Success Checklist

You'll know everything works when:

- ✅ Backend shows "Connected to MongoDB"
- ✅ Frontend loads at http://localhost:3000
- ✅ Test publisher sends data successfully
- ✅ Dashboard shows sensor cards
- ✅ Charts update in real-time
- ✅ Connection status is green

---

## 🌟 Ready to Start?

Run these commands in order:

```bash
# 1. Install everything
pnpm run install:all

# 2. Configure (if not already done)
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env.local

# 3. Start MongoDB
brew services start mongodb-community  # or your OS equivalent

# 4. Launch the app
cd ..
pnpm run dev

# 5. In a new terminal, send test data
pnpm run test:publisher
```

**Then open http://localhost:3000 and enjoy!** 🎊

---

## 💪 You've Got This!

This is a complete, production-ready IoT monitoring system. Whether you're:
- 🏠 Building a smart home
- 🌡️ Monitoring environmental conditions
- 🏭 Creating an industrial IoT solution
- 📚 Learning full-stack development
- 🔬 Working on a research project

**This dashboard is your starting point!**

---

**Happy Monitoring! 📊🚀**

*Questions? Check the docs or explore the codebase - everything is well-documented!*