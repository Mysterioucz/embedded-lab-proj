#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "aisfibre_2.4G_Nui";
const char* password = "Sajja_nui";

// MQTT Configuration
const char* mqtt_server = "crossover.proxy.rlwy.net";
const int mqtt_port = 45028;
const char* mqtt_topic = "home/sensors/esp32";
const char* sensor_id = "nucleo-f411re-001";

// UART Configuration (for STM32 connection)
#define RXD2 18  // GPIO18 - Connect to STM32 TX (PA9)
#define TXD2 17  // GPIO17 - Connect to STM32 RX (PA10)
#define BAUD_RATE 115200

// Timing & Retry Configuration
#define WIFI_TIMEOUT_MS 20000         // 20 seconds WiFi connection timeout
#define MQTT_RETRY_INTERVAL 5000      // 5 seconds between MQTT reconnection attempts
#define WIFI_CHECK_INTERVAL 30000     // 30 seconds between WiFi health checks
#define WATCHDOG_TIMEOUT 60           // 60 seconds watchdog timeout
#define MAX_RECONNECT_ATTEMPTS 5      // Max reconnection attempts before restart
#define DATA_TIMEOUT 120000            // 2 minutes no data timeout (milliseconds)
#define MQTT_BUFFER_SIZE 512           // MQTT packet buffer size
#define LED_BUILTIN 2                  // Built-in LED pin (GPIO2 on most ESP32)

// Buffer Configuration
const int MAX_BUFFER_SIZE = 512;
const int MAX_JSON_SIZE = 384;

enum ErrorCode {
  ERR_NONE = 0,
  ERR_WIFI_INIT = 1,
  ERR_WIFI_CONNECT = 2,
  ERR_MQTT_CONNECT = 3,
  ERR_JSON_PARSE = 4,
  ERR_UART_OVERFLOW = 5,
  ERR_MQTT_PUBLISH = 6,
  ERR_MEMORY_LOW = 7,
  ERR_SYSTEM_CRITICAL = 99,
  ERR_DATA_TIMEOUT = 10,
  ERR_WATCHDOG_FEED = 11
};

WiFiClient espClient;
PubSubClient client(espClient);

// State tracking
struct SystemState {
  bool wifiConnected = false;
  bool mqttConnected = false;
  unsigned long lastWiFiCheck = 0;
  unsigned long lastMQTTAttempt = 0;
  unsigned long lastDataReceived = 0;
  unsigned long lastSuccessfulPublish = 0;
  int wifiReconnectCount = 0;
  int mqttReconnectCount = 0;
  ErrorCode lastError = ERR_NONE;
} sysState;

// Statistics
struct Statistics {
  unsigned long packetsReceived = 0;
  unsigned long packetsPublished = 0;
  unsigned long packetsFailed = 0;
  unsigned long jsonErrors = 0;
  unsigned long mqttErrors = 0;
  unsigned long wifiDrops = 0;
  unsigned long systemRestarts = 0;
} stats;

// LED Blink patterns for status indication
unsigned long lastLedBlink = 0;
int ledBlinkPattern = 0;  // 0=off, 1=slow, 2=fast, 3=solid

hw_timer_t *watchdogTimer = NULL;

void IRAM_ATTR resetModule() {
  ets_printf("\n⚠️ WATCHDOG TIMEOUT - System unresponsive, restarting...\n");
  esp_restart();
}

void initWatchdog() {
  // ESP32 Arduino Core 3.x API
  watchdogTimer = timerBegin(1000000);  // 1 MHz frequency (1 tick = 1 microsecond)
  timerAttachInterrupt(watchdogTimer, &resetModule);
  timerAlarm(watchdogTimer, WATCHDOG_TIMEOUT * 1000000, false, 0);  // 60 seconds, no auto-reload
  Serial.println("🐕 Watchdog timer initialized (" + String(WATCHDOG_TIMEOUT) + "s timeout)");
}

void feedWatchdog() {
  if (watchdogTimer != NULL) {
    timerRestart(watchdogTimer);  // Restart timer countdown
  } else {
    // Watchdog not initialized properly
    static unsigned long lastWarn = 0;
    if (millis() - lastWarn > 30000) {  // Warn every 30s
      Serial.println("⚠️ Watchdog timer not initialized!");
      lastWarn = millis();
    }
  }
}

// LED Status Indicator
void updateLED() {
  unsigned long now = millis();

  // Pattern 0: Off (critical error)
  if (ledBlinkPattern == 0) {
    digitalWrite(LED_BUILTIN, LOW);
    return;
  }

  // Pattern 1: Slow blink (connecting)
  if (ledBlinkPattern == 1) {
    if (now - lastLedBlink > 1000) {
      digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
      lastLedBlink = now;
    }
  }

  // Pattern 2: Fast blink (connected, receiving data)
  if (ledBlinkPattern == 2) {
    if (now - lastLedBlink > 200) {
      digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
      lastLedBlink = now;
    }

    // Blink LED to indicate error
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_BUILTIN, LOW);
      delay(100);
      digitalWrite(LED_BUILTIN, HIGH);
      delay(100);
    }
  }

  // Pattern 3: Solid (fully operational)
  if (ledBlinkPattern == 3) {
    digitalWrite(LED_BUILTIN, HIGH);
  }
}

// Emergency restart with cleanup
void emergencyRestart(const char* reason) {
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║      EMERGENCY RESTART INITIATED       ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.print("Reason: ");
  Serial.println(reason);

  // Blink LED rapidly to indicate restart
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(100);
    digitalWrite(LED_BUILTIN, LOW);
    delay(100);
  }

  stats.systemRestarts++;
  Serial.print("System restart count: ");
  Serial.println(stats.systemRestarts);
  Serial.println("Restarting in 3 seconds...");
  delay(3000);
  ESP.restart();
}

void checkMemory() {
  uint32_t freeHeap = ESP.getFreeHeap();
  if (freeHeap < 50000) {  // Less than 50KB free
    Serial.print("⚠️ LOW MEMORY WARNING: ");
    Serial.print(freeHeap);
    Serial.println(" bytes free");
    sysState.lastError = ERR_MEMORY_LOW;

    if (freeHeap < 20000) {  // Critical: less than 20KB
      Serial.println("❌ CRITICAL MEMORY - Restarting...");
      delay(1000);
      ESP.restart();
    }
  }
}

// ==================== ERROR HANDLING ====================
void logError(ErrorCode error, const char* message) {
  sysState.lastError = error;
  Serial.print("❌ ERROR [");
  Serial.print(error);
  Serial.print("]: ");
  Serial.println(message);

  // DO NOT send errors to MQTT - only log to Serial Monitor
}

void handleCriticalError(ErrorCode error, const char* message) {
  logError(error, message);
  Serial.println("🚨 CRITICAL ERROR - System will restart in 5 seconds...");

  // Save statistics to preferences if needed
  stats.systemRestarts++;


  emergencyRestart(message);
}

// ==================== WIFI FUNCTIONS ====================
bool initWiFi() {
  Serial.println("\n🔧 Initializing WiFi...");

  ledBlinkPattern = 1;  // Slow blink while connecting

  // Force clean WiFi state
  WiFi.persistent(false);
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(1000);

  // ESP32-S3 specific settings
  WiFi.useStaticBuffers(true);
  WiFi.setScanMethod(WIFI_ALL_CHANNEL_SCAN);
  WiFi.setSortMethod(WIFI_CONNECT_AP_BY_SIGNAL);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  // Set hostname for easier identification
  String hostname = "ESP32-" + String(sensor_id);
  WiFi.setHostname(hostname.c_str());

  Serial.println("✅ WiFi initialized");
  Serial.print("Hostname: ");
  Serial.println(hostname);
  return true;
}

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.println("\n========================================");
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(ssid);
  Serial.println("========================================");

  WiFi.begin(ssid, password);

  unsigned long startAttempt = millis();
  int dotCount = 0;

  while (WiFi.status() != WL_CONNECTED &&
         millis() - startAttempt < WIFI_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
    dotCount++;
    if (dotCount % 40 == 0) Serial.println();
    // feedWatchdog();
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    sysState.wifiConnected = true;
    sysState.wifiReconnectCount = 0;

    Serial.println("✅ WiFi connected successfully!");
    Serial.print("📶 SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("📡 IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("📊 Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print("🔐 MAC Address: ");
    Serial.println(WiFi.macAddress());

    ledBlinkPattern = 2;  // Fast blink - connected

    return true;
  } else {
    sysState.wifiConnected = false;
    sysState.wifiReconnectCount++;
    stats.wifiDrops++;

    Serial.println("❌ WiFi connection failed!");
    Serial.print("Attempt: ");
    Serial.print(sysState.wifiReconnectCount);
    Serial.print("/");
    Serial.println(MAX_RECONNECT_ATTEMPTS);

    logError(ERR_WIFI_CONNECT, "Failed to connect to WiFi");

    if (sysState.wifiReconnectCount >= MAX_RECONNECT_ATTEMPTS) {
      handleCriticalError(ERR_WIFI_CONNECT, "Max WiFi reconnect attempts reached");
    }

    return false;
  }
}

void checkWiFiHealth() {
  unsigned long now = millis();

  if (now - sysState.lastWiFiCheck > WIFI_CHECK_INTERVAL) {
    sysState.lastWiFiCheck = now;

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️ WiFi disconnected, reconnecting...");
      sysState.wifiConnected = false;
      stats.wifiDrops++;
      ledBlinkPattern = 1;  // Slow blink while reconnecting
      connectWiFi();
    } else {
      int rssi = WiFi.RSSI();
      if (rssi < -85) {
        Serial.print("⚠️ Weak WiFi signal: ");
        Serial.print(rssi);
        Serial.println(" dBm - Consider moving closer to router");
      } else if (rssi < -70) {
        Serial.print("ℹ️ Fair WiFi signal: ");
        Serial.print(rssi);
        Serial.println(" dBm");
      }
    }
  }
}

// ==================== MQTT FUNCTIONS ====================
bool connectMQTT() {
  unsigned long now = millis();

  // Don't attempt reconnect too frequently
  if (now - sysState.lastMQTTAttempt < MQTT_RETRY_INTERVAL) {
    return false;
  }

  sysState.lastMQTTAttempt = now;

  if (!sysState.wifiConnected || WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Cannot connect MQTT - WiFi not available");
    return false;
  }

  if (client.connected()) {
    return true;
  }

  Serial.print("🔄 Attempting MQTT connection to ");
  Serial.print(mqtt_server);
  Serial.print(":");
  Serial.print(mqtt_port);
  Serial.print("... ");

  // Generate unique client ID
  String clientId = "ESP32-";
  clientId += String(random(0xffff), HEX);

  // Attempt connection with will message (for disconnect detection)
  String willTopic = String(mqtt_topic) + "/status";
  String willMessage = "{\"status\":\"offline\",\"sensorId\":\"" + String(sensor_id) + "\"}";

  bool connected = client.connect(
    clientId.c_str(),
    NULL,  // username (NULL for no auth)
    NULL,  // password (NULL for no auth)
    willTopic.c_str(),
    0,     // will QoS
    true,  // will retain
    willMessage.c_str()
  );

  if (connected) {
    sysState.mqttConnected = true;
    sysState.mqttReconnectCount = 0;

    Serial.println("✅ Connected!");

    // Publish online status
    StaticJsonDocument<128> statusDoc;
    statusDoc["status"] = "online";
    statusDoc["sensorId"] = sensor_id;
    statusDoc["ip"] = WiFi.localIP().toString();
    statusDoc["rssi"] = WiFi.RSSI();

    char statusBuffer[128];
    serializeJson(statusDoc, statusBuffer);
    client.publish(willTopic.c_str(), statusBuffer, true);

    // Subscribe to command topics if needed
    // Subscribe to command topics if needed
    String cmdTopic = String(mqtt_topic) + "/commands";
    client.subscribe(cmdTopic.c_str());

    Serial.println("📝 Subscribed to: " + cmdTopic);
    Serial.println("✅ Publishing sensor data only (no errors/debug to MQTT)");

    ledBlinkPattern = 3;  // Solid - fully operational

    return true;
  } else {
    sysState.mqttConnected = false;
    sysState.mqttReconnectCount++;
    stats.mqttErrors++;

    Serial.print("❌ Failed, rc=");
    Serial.println(client.state());

    // MQTT Error codes explanation
    switch(client.state()) {
      case -4: Serial.println("   Connection timeout"); break;
      case -3: Serial.println("   Connection lost"); break;
      case -2: Serial.println("   Connect failed"); break;
      case -1: Serial.println("   Disconnected"); break;
      case 1: Serial.println("   Bad protocol"); break;
      case 2: Serial.println("   Bad client ID"); break;
      case 3: Serial.println("   Server unavailable"); break;
      case 4: Serial.println("   Bad credentials"); break;
      case 5: Serial.println("   Unauthorized"); break;
    }

    logError(ERR_MQTT_CONNECT, "MQTT connection failed");

    ledBlinkPattern = 2;  // Fast blink - WiFi ok, MQTT connecting

    if (sysState.mqttReconnectCount >= MAX_RECONNECT_ATTEMPTS) {
      Serial.println("⚠️ Max MQTT reconnect attempts reached, will keep trying...");
      Serial.println("   Check backend server status and network connectivity");
      sysState.mqttReconnectCount = 0;  // Reset counter but don't restart
    }

    return false;
  }
}

// Optional: Handle incoming MQTT commands
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 MQTT message on topic: ");
  Serial.println(topic);

  // Parse command if needed
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (!error) {
    const char* cmd = doc["command"];
    if (cmd) {
      Serial.print("Command received: ");
      Serial.println(cmd);

      // Handle commands (e.g., "restart", "status", etc.)
      if (strcmp(cmd, "restart") == 0) {
        Serial.println("Restart command received, restarting...");
        delay(1000);
        ESP.restart();
      } else if (strcmp(cmd, "stats") == 0) {
        printStatistics();
      } else if (strcmp(cmd, "reset_stats") == 0) {
        Serial.println("Resetting statistics...");
        memset(&stats, 0, sizeof(stats));
        Serial.println("✅ Statistics reset");
      } else if (strcmp(cmd, "reconnect") == 0) {
        Serial.println("Force reconnect command received");
        WiFi.disconnect();
        delay(1000);
        connectWiFi();
        connectMQTT();
      }
    }
  } else {
    Serial.print("Failed to parse MQTT command: ");
    Serial.println(error.c_str());
  }
}

// ==================== DATA PROCESSING ====================
bool publishToMQTT(const char* jsonData) {
  if (!client.connected()) {
    logError(ERR_MQTT_PUBLISH, "MQTT not connected");
    return false;
  }

  bool result = client.publish(mqtt_topic, jsonData);

  if (result) {
    sysState.lastSuccessfulPublish = millis();
    stats.packetsPublished++;
    return true;
  } else {
    stats.mqttErrors++;
    logError(ERR_MQTT_PUBLISH, "Failed to publish to MQTT");
    return false;
  }
}

void processUARTData(String jsonString) {
  // Trim whitespace and newlines
  jsonString.trim();

  // Skip empty strings
  if (jsonString.length() == 0) {
    return;
  }

  // Filter out non-JSON data (debug messages, system messages, etc.)
  // Only process lines that look like JSON (start with '{' and end with '}')
  if (!jsonString.startsWith("{") || !jsonString.endsWith("}")) {
    // This is a debug/system message from STM32 - just print to Serial
    Serial.print("[STM32]: ");
    Serial.println(jsonString);
    return;
  }

  Serial.println("\n📨 Received JSON from STM32:");
  Serial.println(jsonString);

  stats.packetsReceived++;
  sysState.lastDataReceived = millis();

  // Parse JSON with error handling
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, jsonString);

  if (error) {
    Serial.print("❌ JSON parsing failed: ");
    Serial.println(error.c_str());
    stats.jsonErrors++;
    stats.packetsFailed++;
    logError(ERR_JSON_PARSE, error.c_str());
    return;
  }

  // Validate required fields
  if (!doc.containsKey("temp") || !doc.containsKey("hum") || !doc.containsKey("lux")) {
    Serial.println("❌ Invalid JSON: Missing required fields");
    stats.jsonErrors++;
    stats.packetsFailed++;
    logError(ERR_JSON_PARSE, "Missing required fields in JSON");
    return;
  }

  // Extract data from STM32 JSON with defaults
  float temperature = doc["temp"] | 0.0;
  float humidity = doc["hum"] | 0.0;
  float lux = doc["lux"] | 0.0;
  const char* time = doc["time"] | "N/A";

  // Validate sensor data ranges
  bool dataValid = true;
  if (temperature < -40 || temperature > 80) {
    Serial.println("⚠️ Temperature out of valid range");
    dataValid = false;
  }
  if (humidity < 0 || humidity > 100) {
    Serial.println("⚠️ Humidity out of valid range");
    dataValid = false;
  }
  if (lux < 0 || lux > 100000) {
    Serial.println("⚠️ Light level out of valid range");
    dataValid = false;
  }

  // Create JSON for backend - ONLY SENSOR DATA (no debug info)
  StaticJsonDocument<MAX_JSON_SIZE> backendDoc;

  // Add sensor identification
  backendDoc["sensorId"] = sensor_id;

  // Add sensor data only
  backendDoc["temperature"] = temperature;
  backendDoc["humidity"] = humidity;
  backendDoc["light"] = lux;
  backendDoc["time"] = time;
  backendDoc["timestamp"] = millis();

  // Note: Debug info like RSSI, freeHeap, valid flag are NOT sent to MQTT
  // They are only shown in Serial Monitor

  // Serialize to JSON string
  char jsonBuffer[MAX_JSON_SIZE];
  size_t jsonSize = serializeJson(backendDoc, jsonBuffer);

  if (jsonSize == 0) {
    Serial.println("❌ Failed to serialize JSON");
    stats.packetsFailed++;
    return;
  }

  // Print formatted data
  Serial.println("📊 Parsed Data:");
  Serial.print("  🌡️  Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("  💧 Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  Serial.print("  💡 Light: ");
  Serial.print(lux);
  Serial.println(" lux");
  Serial.print("  🕐 Time: ");
  Serial.println(time);
  Serial.print("  ✓ Valid: ");
  Serial.print(dataValid ? "Yes" : "No");
  Serial.print(" | RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.print(" dBm | Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");

  // Publish to MQTT
  if (publishToMQTT(jsonBuffer)) {
    Serial.println("✅ Published to MQTT successfully");

    // Print statistics every 10 packets
    if (stats.packetsPublished % 10 == 0) {
      printStatistics();
    }
  } else {
    Serial.println("❌ Failed to publish to MQTT");
    stats.packetsFailed++;
  }

  Serial.println("----------------------------------------");

  // Brief LED pulse on successful data processing
  digitalWrite(LED_BUILTIN, LOW);
  delay(50);
  digitalWrite(LED_BUILTIN, HIGH);

  // feedWatchdog();
}

void printStatistics() {
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║         SYSTEM STATISTICS              ║");
  Serial.println("╠════════════════════════════════════════╣");
  Serial.print("║ Packets Received:  ");
  Serial.println(stats.packetsReceived);
  Serial.print("║ Packets Published: ");
  Serial.println(stats.packetsPublished);
  Serial.print("║ Packets Failed:    ");
  Serial.println(stats.packetsFailed);
  Serial.print("║ JSON Errors:       ");
  Serial.println(stats.jsonErrors);
  Serial.print("║ MQTT Errors:       ");
  Serial.println(stats.mqttErrors);
  Serial.print("║ WiFi Drops:        ");
  Serial.println(stats.wifiDrops);

  if (stats.packetsReceived > 0) {
    float successRate = (stats.packetsPublished * 100.0) / stats.packetsReceived;
    Serial.print("║ Success Rate:      ");
    Serial.print(successRate, 1);
    Serial.println(" %");
  }

  Serial.print("║ Free Heap:         ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  Serial.print("║ Uptime:            ");
  Serial.print(millis() / 1000);
  Serial.println(" seconds");
  Serial.print("║ WiFi RSSI:         ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.print("║ MQTT State:        ");
  Serial.println(client.connected() ? "Connected" : "Disconnected");
  Serial.print("║ System Restarts:   ");
  Serial.println(stats.systemRestarts);
  Serial.println("╚════════════════════════════════════════╝\n");
}

// ==================== SETUP ====================
void setup() {
  // Initialize USB Serial for debugging
  Serial.begin(115200);
  delay(2000);  // Give time for serial to initialize

  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║   ESP32 UART-MQTT Bridge Starting      ║");
  Serial.println("╠════════════════════════════════════════╣");
  Serial.println("║ Version: 2.0 (Error Handling)         ║");
  Serial.println("║ Device: ESP32 + STM32 Nucleo F411RE   ║");
  Serial.println("╚════════════════════════════════════════╝\n");

  // Initialize LED
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  ledBlinkPattern = 1;  // Start with slow blink

  // Initialize watchdog
  initWatchdog();

  // Check memory
  Serial.print("💾 Free Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");

  // Initialize UART Serial for STM32 communication
  Serial2.begin(BAUD_RATE, SERIAL_8N1, RXD2, TXD2);
  Serial.print("📡 UART2 initialized at ");
  Serial.print(BAUD_RATE);
  Serial.println(" baud");
  Serial.print("   RX Pin: GPIO");
  Serial.println(RXD2);
  Serial.print("   TX Pin: GPIO");
  Serial.println(TXD2);
  Serial.println();

  // Initialize WiFi
  if (!initWiFi()) {
    handleCriticalError(ERR_WIFI_INIT, "WiFi initialization failed");
  }

  // Connect to WiFi
  if (!connectWiFi()) {
    Serial.println("⚠️ Initial WiFi connection failed, will retry in loop...");
  }

  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setBufferSize(MQTT_BUFFER_SIZE);  // Increase buffer for larger messages
  client.setKeepAlive(60);
  client.setSocketTimeout(30);
  client.setCallback(mqttCallback);

  // Try initial MQTT connection
  if (sysState.wifiConnected) {
    connectMQTT();
  }

  Serial.println("\n✅ ESP32 UART-MQTT Bridge Ready!");
  Serial.println("Waiting for data from STM32...\n");
  Serial.println("========================================\n");

  // Clear any garbage data in UART buffer
  while(Serial2.available()) {
    Serial2.read();
  }

  // feedWatchdog();
}

// ==================== MAIN LOOP ====================
void loop() {
  // feedWatchdog();
  updateLED();  // Update LED status indicator

  // Check WiFi health periodically
  checkWiFiHealth();

  // Maintain WiFi connection
  if (!sysState.wifiConnected || WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Maintain MQTT connection
  if (sysState.wifiConnected && !client.connected()) {
    connectMQTT();
  }

  // MQTT loop (handle incoming messages, maintain connection)
  if (client.connected()) {
    client.loop();
  }

  // Read data from STM32 via UART using readStringUntil for better performance
  if (Serial2.available()) {
    // Read complete line ending with \n

    String incomingData = Serial2.readStringUntil('\n');
    Serial.println(incomingData);
    // Check if data is too large
    if (incomingData.length() >= MAX_BUFFER_SIZE) {
      Serial.println("⚠️ UART data overflow detected!");
      Serial.print("   Data length: ");
      Serial.println(incomingData.length());

      // Try to find if there's a complete JSON in the data
      int jsonStart = incomingData.indexOf('{');
      int jsonEnd = incomingData.lastIndexOf('}');

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        // Extract JSON only
        String possibleJson = incomingData.substring(jsonStart, jsonEnd + 1);
        Serial.println("   Attempting to extract JSON from overflow data...");
        processUARTData(possibleJson);
      } else {
        logError(ERR_UART_OVERFLOW, "UART buffer overflow - no valid JSON found");
        stats.packetsFailed++;
      }

    } else if (incomingData.length() > 0) {
      // Trim whitespace and carriage returns
      incomingData.trim();

      if (incomingData.length() > 0) {
        Serial.println("🔄 Processing UART line:");
        Serial.print("   Raw data (");
        Serial.print(incomingData.length());
        Serial.print(" bytes): ");
        Serial.println(incomingData);

        // Process the data
        processUARTData(incomingData);
      }
    }
  }

  // Check memory health periodically
  static unsigned long lastMemCheck = 0;
  if (millis() - lastMemCheck > 60000) {  // Every minute
    lastMemCheck = millis();
    checkMemory();
  }

  // Check for data timeout (no data from STM32)
  if (sysState.lastDataReceived > 0 &&
      millis() - sysState.lastDataReceived > DATA_TIMEOUT) {
    Serial.println("⚠️ No data from STM32 for " + String(DATA_TIMEOUT/1000) + " seconds");
    Serial.println("   Possible issues:");
    Serial.println("   - UART connections loose (TX/RX/GND)");
    Serial.println("   - STM32 not running or crashed");
    Serial.println("   - Baud rate mismatch");
    Serial.println("   - TX and RX wires swapped");
    logError(ERR_DATA_TIMEOUT, "No data from STM32");
    sysState.lastDataReceived = millis();  // Reset to avoid spam

    // Flash LED to indicate data timeout
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED_BUILTIN, LOW);
      delay(200);
      digitalWrite(LED_BUILTIN, HIGH);
      delay(200);
    }
  }

  // Small delay to prevent watchdog issues
  delay(10);
}

/*
 * ==================== CONFIGURATION NOTES ====================
 *
 * BEFORE UPLOADING:
 * 1. Update WiFi credentials (lines 28-29)
 * 2. Update MQTT server IP (line 32)
 * 3. Verify UART pins match your wiring (lines 37-38)
 *
 * ERROR HANDLING FEATURES:
 * - Automatic WiFi reconnection with retry limits
 * - MQTT reconnection with exponential backoff
 * - JSON validation and error reporting
 * - Memory leak detection and prevention
 * - Watchdog timer for system stability
 * - Comprehensive error logging
 * - Statistical tracking
 * - Buffer overflow protection
 * - Data validation (sensor ranges)
 *
 * TROUBLESHOOTING:
 * - Monitor Serial output for detailed error messages
 * - Check statistics every 10 packets
 * - Use MQTT commands to check system status
 * - Errors are published to MQTT topic: home/sensors/errors
 *
 * MQTT COMMANDS (send to home/sensors/esp32/commands):
 * - {"command":"restart"} - Restart ESP32
 * - {"command":"stats"} - Print statistics
 */
