/*
 * ESP32 IoT Sensor Example
 * 
 * This example demonstrates how to publish sensor data to the IoT Dashboard
 * via MQTT protocol.
 * 
 * Hardware Required:
 * - ESP32 Development Board
 * - DHT22 Temperature & Humidity Sensor (optional)
 * - BMP280 Pressure Sensor (optional)
 * - LDR Light Sensor (optional)
 * - PIR Motion Sensor (optional)
 * 
 * Libraries Required:
 * - PubSubClient (MQTT)
 * - WiFi
 * - DHT sensor library (if using DHT22)
 * - Adafruit BMP280 (if using pressure sensor)
 * - ArduinoJson
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "192.168.1.100";  // Your backend server IP
const int mqtt_port = 1883;
const char* mqtt_topic = "home/sensors/esp32";
const char* sensor_id = "esp32-001";

// Pin Configuration (adjust based on your wiring)
#define DHT_PIN 4           // DHT22 data pin
#define LDR_PIN 34          // LDR analog pin
#define PIR_PIN 5           // PIR motion sensor pin

// Timing
unsigned long lastPublish = 0;
const unsigned long publishInterval = 5000; // 5 seconds

WiFiClient espClient;
PubSubClient client(espClient);

// Function to connect to WiFi
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Function to reconnect to MQTT broker
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Attempt to connect
    if (client.connect(sensor_id)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// Function to read temperature (simulated if no sensor)
float readTemperature() {
  // If you have DHT22, use:
  // return dht.readTemperature();
  
  // Simulated reading for testing
  return 20.0 + (random(0, 100) / 10.0);
}

// Function to read humidity (simulated if no sensor)
float readHumidity() {
  // If you have DHT22, use:
  // return dht.readHumidity();
  
  // Simulated reading for testing
  return 50.0 + (random(0, 300) / 10.0);
}

// Function to read pressure (simulated if no sensor)
float readPressure() {
  // If you have BMP280, use:
  // return bmp.readPressure() / 100.0F;
  
  // Simulated reading for testing
  return 1000.0 + (random(0, 400) / 10.0);
}

// Function to read light level
int readLight() {
  // Read analog value from LDR
  int rawValue = analogRead(LDR_PIN);
  // Convert to lux (approximate)
  return map(rawValue, 0, 4095, 0, 1000);
}

// Function to read motion
bool readMotion() {
  return digitalRead(PIR_PIN) == HIGH;
}

// Function to publish sensor data
void publishSensorData() {
  // Create JSON document
  StaticJsonDocument<256> doc;
  
  // Add sensor data
  doc["sensorId"] = sensor_id;
  doc["temperature"] = readTemperature();
  doc["humidity"] = readHumidity();
  doc["pressure"] = readPressure();
  doc["light"] = readLight();
  doc["motion"] = readMotion();
  doc["timestamp"] = millis(); // Use NTP time in production
  
  // Serialize JSON to string
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  // Publish to MQTT
  if (client.publish(mqtt_topic, jsonBuffer)) {
    Serial.println("Data published:");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("Failed to publish data");
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  
  // Initialize sensors
  // If using DHT22:
  // dht.begin();
  
  // If using BMP280:
  // if (!bmp.begin(0x76)) {
  //   Serial.println("Could not find BMP280 sensor!");
  //   while (1);
  // }
  
  // Connect to WiFi
  setup_wifi();
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  
  Serial.println("ESP32 Sensor Node Ready!");
}

void loop() {
  // Ensure MQTT connection
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publish sensor data at regular intervals
  unsigned long now = millis();
  if (now - lastPublish > publishInterval) {
    lastPublish = now;
    publishSensorData();
  }
}

/*
 * Installation Instructions:
 * 
 * 1. Install Arduino IDE or PlatformIO
 * 
 * 2. Install ESP32 Board Support:
 *    - Arduino IDE: File -> Preferences -> Additional Board Manager URLs
 *    - Add: https://dl.espressif.com/dl/package_esp32_index.json
 *    - Tools -> Board -> Board Manager -> Install "esp32"
 * 
 * 3. Install Required Libraries:
 *    - Sketch -> Include Library -> Manage Libraries
 *    - Install: PubSubClient, ArduinoJson
 *    - Optional: DHT sensor library, Adafruit BMP280
 * 
 * 4. Configure:
 *    - Update WiFi credentials (ssid, password)
 *    - Update MQTT server IP address
 *    - Adjust pin numbers based on your wiring
 * 
 * 5. Upload:
 *    - Select board: ESP32 Dev Module
 *    - Select port
 *    - Click Upload
 * 
 * 6. Monitor:
 *    - Open Serial Monitor (115200 baud)
 *    - Watch for successful connection and data publishing
 *    - Check dashboard at http://localhost:3000
 * 
 * Wiring Diagram:
 * 
 * DHT22:
 *   - VCC -> 3.3V
 *   - GND -> GND
 *   - DATA -> GPIO 4
 * 
 * LDR (Light Sensor):
 *   - One leg -> 3.3V
 *   - Other leg -> GPIO 34 and 10K resistor to GND
 * 
 * PIR Motion Sensor:
 *   - VCC -> 5V
 *   - GND -> GND
 *   - OUT -> GPIO 5
 * 
 * Troubleshooting:
 * 
 * - If WiFi won't connect: Check SSID and password
 * - If MQTT won't connect: Verify server IP and port 1883 is open
 * - If no data on dashboard: Check backend logs for incoming messages
 * - If sensors read wrong: Check wiring and pin numbers
 */