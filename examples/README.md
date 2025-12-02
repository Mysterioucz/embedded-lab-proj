# IoT Sensor Examples

This directory contains example code for various IoT devices to publish sensor data to the dashboard.

## Available Examples

### 1. ESP32/Arduino (`esp32_sensor.ino`)
Example code for ESP32 microcontroller with various sensors.

**Features:**
- WiFi connectivity
- MQTT publishing
- DHT22 temperature & humidity
- BMP280 pressure sensor
- LDR light sensor
- PIR motion sensor
- Simulated data for testing without sensors

**Requirements:**
- ESP32 Development Board
- Arduino IDE or PlatformIO
- Libraries: PubSubClient, ArduinoJson

### 2. Raspberry Pi (`raspberry_pi_sensor.py`)
Python script for Raspberry Pi with GPIO sensors.

**Features:**
- MQTT publishing
- Multiple sensor support
- Graceful fallback to simulated data
- Status LED indicator
- Systemd service support

**Requirements:**
- Raspberry Pi (any model)
- Python 3.7+
- Libraries: paho-mqtt, RPi.GPIO

## Quick Start

### ESP32 Setup

1. **Install Arduino IDE**
   ```bash
   # Download from https://www.arduino.cc/en/software
   ```

2. **Install ESP32 Board Support**
   - File → Preferences → Additional Board Manager URLs
   - Add: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Board Manager → Search "esp32" → Install

3. **Install Libraries**
   - Sketch → Include Library → Manage Libraries
   - Install: `PubSubClient`, `ArduinoJson`

4. **Configure & Upload**
   ```cpp
   // Edit these lines in esp32_sensor.ino:
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* mqtt_server = "192.168.1.100";  // Your backend IP
   ```
   - Select Board: ESP32 Dev Module
   - Select Port
   - Click Upload

### Raspberry Pi Setup

1. **Install Dependencies**
   ```bash
   sudo apt-get update
   pip3 install paho-mqtt
   
   # Optional sensor libraries
   pip3 install adafruit-circuitpython-dht
   pip3 install adafruit-circuitpython-bmp280
   ```

2. **Configure Script**
   ```python
   # Edit these lines in raspberry_pi_sensor.py:
   MQTT_BROKER = "localhost"  # Or your backend IP
   MQTT_PORT = 1883
   SENSOR_ID = "rpi-001"
   ```

3. **Run**
   ```bash
   python3 raspberry_pi_sensor.py
   ```

## MQTT Message Format

All examples should publish JSON in this format:

```json
{
  "sensorId": "unique-sensor-id",
  "temperature": 23.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "light": 450,
  "motion": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Supported Fields:**
- `sensorId` (string) - Unique identifier for the sensor
- `temperature` (number) - Temperature in Celsius
- `humidity` (number) - Relative humidity percentage
- `pressure` (number) - Atmospheric pressure in hPa
- `light` (number) - Light level in lux
- `motion` (boolean) - Motion detected status
- `timestamp` (string) - ISO 8601 timestamp

**Note:** All fields are optional. Include only the sensors you have.

## Topic Structure

Use hierarchical topics for organization:

```
home/sensors/[location]/[sensor-type]
```

**Examples:**
- `home/sensors/living-room`
- `home/sensors/bedroom/temperature`
- `home/sensors/kitchen/motion`
- `home/sensors/outdoor/weather`

## Testing Without Hardware

Both examples support simulated data for testing:

### ESP32 (Simulated Mode)
The code automatically uses simulated data if sensors aren't detected. Just upload and run!

### Raspberry Pi (Simulated Mode)
Run without sensor libraries installed - it will automatically use simulated data:
```bash
python3 raspberry_pi_sensor.py
```

## Wiring Diagrams

### ESP32 Standard Wiring

```
DHT22 Temperature & Humidity Sensor:
├─ VCC   → 3.3V
├─ DATA  → GPIO 4 (with 10K pull-up resistor)
└─ GND   → GND

BMP280 Pressure Sensor (I2C):
├─ VCC   → 3.3V
├─ GND   → GND
├─ SCL   → GPIO 22
└─ SDA   → GPIO 21

LDR Light Sensor:
├─ One leg → 3.3V
└─ Other leg → GPIO 34 + 10K resistor to GND

PIR Motion Sensor:
├─ VCC   → 5V
├─ OUT   → GPIO 5
└─ GND   → GND
```

### Raspberry Pi Standard Wiring

```
DHT22 Temperature & Humidity Sensor:
├─ Pin 1 (VCC)  → 3.3V (Pin 1) or 5V (Pin 2)
├─ Pin 2 (DATA) → GPIO 4 (Pin 7) + 10K pull-up to VCC
├─ Pin 3        → Not connected
└─ Pin 4 (GND)  → GND (Pin 6)

BMP280 Pressure Sensor (I2C):
├─ VCC   → 3.3V (Pin 1)
├─ GND   → GND (Pin 6)
├─ SCL   → GPIO 3/SCL (Pin 5)
└─ SDA   → GPIO 2/SDA (Pin 3)

PIR Motion Sensor:
├─ VCC   → 5V (Pin 2)
├─ OUT   → GPIO 17 (Pin 11)
└─ GND   → GND (Pin 9)

Status LED (Optional):
├─ Anode (+)  → GPIO 27 (Pin 13) + 220Ω resistor
└─ Cathode (-) → GND (Pin 14)
```

## Common Issues

### ESP32

**Problem:** WiFi won't connect
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check WiFi signal strength

**Problem:** MQTT connection fails
- Verify backend server IP address
- Check if port 1883 is open
- Ensure backend is running

**Problem:** Upload fails
- Hold BOOT button while uploading
- Check USB cable (use data cable, not charge-only)
- Try different USB port

### Raspberry Pi

**Problem:** Permission denied on GPIO
```bash
sudo usermod -a -G gpio pi
sudo reboot
```

**Problem:** I2C device not found
```bash
# Enable I2C
sudo raspi-config
# Interface Options → I2C → Enable

# Check devices
sudo i2cdetect -y 1
```

**Problem:** DHT sensor timeout
- Normal behavior, DHT sensors can be unreliable
- Ensure proper wiring
- Add 10K pull-up resistor on data line
- Check power supply (use 5V for DHT22)

## Adding Your Own Sensors

### 1. Read Sensor Data
```cpp
// ESP32/Arduino
float sensorValue = analogRead(SENSOR_PIN);
```

```python
# Raspberry Pi
import board
import busio
sensor_value = read_from_sensor()
```

### 2. Create JSON Payload
```cpp
// ESP32/Arduino
StaticJsonDocument<256> doc;
doc["sensorId"] = "my-sensor";
doc["customValue"] = sensorValue;
char buffer[256];
serializeJson(doc, buffer);
```

```python
# Raspberry Pi
import json
data = {
    "sensorId": "my-sensor",
    "customValue": sensor_value
}
payload = json.dumps(data)
```

### 3. Publish via MQTT
```cpp
// ESP32/Arduino
client.publish("home/sensors/custom", buffer);
```

```python
# Raspberry Pi
client.publish("home/sensors/custom", payload)
```

## Performance Tips

### ESP32
- Use deep sleep for battery-powered sensors
- Adjust publish interval based on battery life needs
- Consider using QoS 0 for less critical data

### Raspberry Pi
- Run as systemd service for auto-start
- Use cron for scheduled monitoring
- Log to file for debugging: `python3 script.py > sensor.log 2>&1`

## Security Considerations

1. **WiFi Credentials**: Don't hardcode in production code
2. **MQTT Authentication**: Consider using username/password
3. **TLS/SSL**: Enable for production deployments
4. **Sensor ID**: Use unique, non-guessable identifiers

## Next Steps

1. Test with simulated data
2. Add real sensors one at a time
3. Verify data appears on dashboard
4. Customize topics and sensor IDs
5. Deploy to production

## Support

- Check the main [README.md](../README.md) for backend/frontend setup
- Review [QUICKSTART.md](../QUICKSTART.md) for system overview
- Open an issue if you encounter problems

## Contributing

Have an example for a different platform? Contributions welcome!
- Arduino Uno/Mega
- ESP8266
- STM32
- BeagleBone
- Other platforms

---

**Happy Tinkering! 🔧⚡**