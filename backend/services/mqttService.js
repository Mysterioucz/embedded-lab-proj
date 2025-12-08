const mqtt = require("mqtt");
const aedes = require("aedes");
const net = require("net");
const SensorData = require("../models/SensorData");

class MQTTService {
    constructor() {
        this.client = null;
        this.broker = null;
        this.server = null;
        this.socketIO = null;
        this.isExternal = process.env.EXTERNAL_MQTT_BROKER === "true";
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.isClosing = false;
    }

    /**
     * Initialize MQTT service
     * @param {Object} io - Socket.io instance for broadcasting
     */
    initialize(io) {
        this.socketIO = io;

        if (this.isExternal) {
            this.connectToExternalBroker();
        } else {
            this.startLocalBroker();
        }
    }

    /**
     * Start local Aedes MQTT broker (for development)
     */
    startLocalBroker() {
        const port = process.env.MQTT_PORT || 1883;

        this.broker = aedes();
        this.server = net.createServer(this.broker.handle);

        this.server.listen(port, () => {
            console.log(`🚀 Local MQTT Broker (Aedes) running on port ${port}`);
            console.log(`📡 Connect with: mqtt://localhost:${port}`);
        });

        this.server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(
                    `❌ Port ${port} is already in use. Please free the port or use external broker.`,
                );
            } else {
                console.error("❌ MQTT server error:", error.message);
            }
        });

        // Setup Aedes broker event handlers
        this.setupAedesHandlers();
    }

    /**
     * Setup Aedes broker event handlers
     */
    setupAedesHandlers() {
        // Client connected
        this.broker.on("client", (client) => {
            console.log(`📱 MQTT Client Connected: ${client.id}`);
        });

        // Client disconnected
        this.broker.on("clientDisconnect", (client) => {
            console.log(`📴 MQTT Client Disconnected: ${client.id}`);
        });

        // Message published
        this.broker.on("publish", async (packet, client) => {
            // Skip system topics
            if (packet.topic.startsWith("$SYS")) {
                return;
            }

            const topic = packet.topic;
            const message = packet.payload.toString();

            console.log(`📩 Received on topic "${topic}":`, message);

            try {
                // Parse JSON message
                const data = this.parseMessage(message);

                // Create and save sensor data
                const sensorData = await this.saveSensorData(topic, data);

                // Broadcast to WebSocket clients
                this.broadcastToClients(topic, sensorData);

                console.log("✅ Message processed successfully");
            } catch (error) {
                console.error("❌ Error processing message:", error.message);
            }
        });

        // Client subscribed
        this.broker.on("subscribe", (subscriptions, client) => {
            console.log(
                `📬 Client ${client?.id || "system"} subscribed to: ${subscriptions.map((s) => s.topic).join(", ")}`,
            );
        });

        // Client unsubscribed
        this.broker.on("unsubscribe", (subscriptions, client) => {
            console.log(
                `📭 Client ${client?.id || "system"} unsubscribed from: ${subscriptions.join(", ")}`,
            );
        });
    }

    /**
     * Connect to external MQTT broker (e.g., Mosquitto on Railway)
     */
    connectToExternalBroker() {
        const mqttHost = process.env.MQTT_HOST || "localhost";
        const mqttPort = process.env.MQTT_PORT || 1883;
        const mqttUsername = process.env.MQTT_USERNAME;
        const mqttPassword = process.env.MQTT_PASSWORD;

        const options = {
            host: mqttHost,
            port: parseInt(mqttPort),
            protocol: "mqtt",
            reconnectPeriod: 5000,
            connectTimeout: 30000,
        };

        // Add authentication if provided
        if (mqttUsername && mqttPassword) {
            options.username = mqttUsername;
            options.password = mqttPassword;
        }

        console.log(
            `🔌 Connecting to external MQTT broker at ${mqttHost}:${mqttPort}...`,
        );

        this.client = mqtt.connect(options);
        this.setupClientHandlers();
    }

    /**
     * Set up MQTT client event handlers (for external broker)
     */
    setupClientHandlers() {
        // Connection successful
        this.client.on("connect", () => {
            console.log("✅ Connected to external MQTT broker");
            this.reconnectAttempts = 0;

            // Subscribe to all sensor topics
            this.subscribeToTopics();
        });

        // Message received
        this.client.on("message", async (topic, message) => {
            await this.handleMessage(topic, message);
        });

        // Connection error
        this.client.on("error", (error) => {
            console.error("❌ MQTT connection error:", error.message);
        });

        // Reconnecting
        this.client.on("reconnect", () => {
            this.reconnectAttempts++;
            console.log(
                `🔄 Reconnecting to MQTT broker... (attempt ${this.reconnectAttempts})`,
            );

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error(
                    "❌ Max reconnection attempts reached. Stopping reconnection.",
                );
                this.client.end();
            }
        });

        // Connection closed
        this.client.on("close", () => {
            console.log("🔌 Disconnected from MQTT broker");
        });

        // Offline
        this.client.on("offline", () => {
            console.log("📴 MQTT client is offline");
        });
    }

    /**
     * Subscribe to sensor topics
     */
    subscribeToTopics() {
        const topics = [
            "home/sensors/#", // Subscribe to all sensor topics
            "sensor/#",
            "esp32/#",
        ];

        topics.forEach((topic) => {
            this.client.subscribe(topic, (err) => {
                if (err) {
                    console.error(
                        `❌ Failed to subscribe to ${topic}:`,
                        err.message,
                    );
                } else {
                    console.log(`📬 Subscribed to topic: ${topic}`);
                }
            });
        });
    }

    /**
     * Handle incoming MQTT message (for external broker)
     * @param {string} topic - MQTT topic
     * @param {Buffer} message - Message buffer
     */
    async handleMessage(topic, message) {
        // Skip system topics
        if (topic.startsWith("$SYS")) {
            return;
        }

        const messageStr = message.toString();
        console.log(`📩 Received on topic "${topic}":`, messageStr);

        try {
            // Parse JSON message
            const data = this.parseMessage(messageStr);

            // Create and save sensor data
            const sensorData = await this.saveSensorData(topic, data);

            // Broadcast to WebSocket clients
            this.broadcastToClients(topic, sensorData);

            console.log("✅ Message processed successfully");
        } catch (error) {
            console.error("❌ Error processing message:", error.message);
        }
    }

    /**
     * Parse MQTT message
     * @param {string} message - Raw message string
     * @returns {Object} Parsed data
     */
    parseMessage(message) {
        try {
            return JSON.parse(message);
        } catch (error) {
            throw new Error(`Invalid JSON format: ${error.message}`);
        }
    }

    /**
     * Parse timestamp from STM32 format (DD/MM/YYYY HH:MM:SS)
     * @param {string} timeString - Time string from STM32
     * @returns {Date} Parsed date object
     */
    parseTimestamp(timeString) {
        try {
            // Format: "08/12/2025 14:01:57" (DD/MM/YYYY HH:MM:SS)
            const parts = timeString.trim().split(" ");
            if (parts.length !== 2) {
                throw new Error("Invalid timestamp format");
            }

            const [datePart, timePart] = parts;
            const [day, month, year] = datePart.split("/").map(Number);
            const [hours, minutes, seconds] = timePart.split(":").map(Number);

            // JavaScript Date expects: year, month (0-indexed), day, hours, minutes, seconds
            const date = new Date(
                year,
                month - 1,
                day,
                hours,
                minutes,
                seconds,
            );

            // Validate the date
            if (isNaN(date.getTime())) {
                throw new Error("Invalid date values");
            }

            return date;
        } catch (error) {
            console.warn(
                `⚠️ Failed to parse timestamp "${timeString}": ${error.message}, using current time`,
            );
            return new Date();
        }
    }

    /**
     * Save sensor data to database
     * @param {string} topic - MQTT topic
     * @param {Object} data - Sensor data
     * @returns {Promise<Object>} Saved sensor data
     */
    async saveSensorData(topic, data) {
        // Parse timestamp from STM32 format
        let timestamp = new Date();
        if (data.time) {
            timestamp = this.parseTimestamp(data.time);
        } else if (data.timestamp) {
            // Try to parse as ISO string first
            timestamp = new Date(data.timestamp);
            if (isNaN(timestamp.getTime())) {
                // If ISO parse fails, try STM32 format
                timestamp = this.parseTimestamp(data.timestamp);
            }
        }

        const sensorData = new SensorData({
            topic,
            sensorId: data.sensorId || data.sensor_id || topic.split("/").pop(),
            temperature: data.temperature || data.temp,
            humidity: data.humidity || data.hum,
            pressure: data.pressure,
            light: data.light || data.lux,
            motion: data.motion,
            timestamp: timestamp,
        });

        await sensorData.save();
        console.log(
            "💾 Saved to database with timestamp:",
            timestamp.toISOString(),
        );

        return sensorData;
    }

    /**
     * Broadcast data to all WebSocket clients
     * @param {string} topic - MQTT topic
     * @param {Object} data - Sensor data
     */
    broadcastToClients(topic, data) {
        if (this.socketIO) {
            this.socketIO.emit("sensor-data", {
                topic,
                data,
            });
            console.log("📡 Broadcast to frontend clients");
        }
    }

    /**
     * Publish message to MQTT topic
     * @param {string} topic - MQTT topic
     * @param {Object} data - Data to publish
     */
    publish(topic, data) {
        const message = JSON.stringify(data);

        // If using external broker
        if (this.isExternal && this.client) {
            if (!this.client.connected) {
                console.error("❌ Cannot publish: MQTT client not connected");
                return;
            }

            this.client.publish(topic, message, { qos: 0 }, (error) => {
                if (error) {
                    console.error(
                        "❌ Error publishing message:",
                        error.message,
                    );
                } else {
                    console.log(`📤 Published to topic "${topic}"`);
                }
            });
        }
        // If using local broker
        else if (this.broker) {
            this.broker.publish(
                {
                    topic,
                    payload: message,
                    qos: 0,
                    retain: false,
                },
                (error) => {
                    if (error) {
                        console.error(
                            "❌ Error publishing message:",
                            error.message,
                        );
                    } else {
                        console.log(`📤 Published to topic "${topic}"`);
                    }
                },
            );
        } else {
            console.error("❌ Cannot publish: No MQTT broker available");
        }
    }

    /**
     * Close MQTT connection/broker
     */
    close() {
        // Prevent multiple close calls
        if (this.isClosing) {
            return Promise.resolve();
        }
        this.isClosing = true;

        return new Promise((resolve) => {
            // Close external client
            if (this.client) {
                this.client.end(true, () => {
                    console.log("🔒 MQTT client closed");
                    resolve();
                });
            }
            // Close local broker
            else if (this.server && this.broker) {
                this.broker.close(() => {
                    this.server.close(() => {
                        console.log("🔒 MQTT broker closed");
                        resolve();
                    });
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Check if MQTT is connected
     */
    isConnected() {
        if (this.isExternal) {
            return this.client && this.client.connected;
        } else {
            return this.server && this.server.listening;
        }
    }
}

module.exports = new MQTTService();
