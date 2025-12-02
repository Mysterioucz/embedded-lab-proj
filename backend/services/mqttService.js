const aedes = require("aedes");
const net = require("net");
const SensorData = require("../models/SensorData");

class MQTTService {
    constructor() {
        this.broker = aedes();
        this.server = null;
        this.port = process.env.MQTT_PORT || 1883;
        this.socketIO = null;
    }

    /**
     * Initialize MQTT broker and set up event handlers
     * @param {Object} io - Socket.io instance for broadcasting
     */
    initialize(io) {
        this.socketIO = io;
        this.setupEventHandlers();
        this.createServer();
    }

    /**
     * Create MQTT server
     */
    createServer() {
        this.server = net.createServer(this.broker.handle);

        this.server.listen(this.port, () => {
            console.log(`🚀 MQTT Broker running on port ${this.port}`);
        });

        this.server.on("error", (error) => {
            console.error("❌ MQTT server error:", error.message);
        });
    }

    /**
     * Set up MQTT broker event handlers
     */
    setupEventHandlers() {
        // Client connected
        this.broker.on("client", (client) => {
            console.log(`📱 Client Connected: ${client.id}`);
        });

        // Client disconnected
        this.broker.on("clientDisconnect", (client) => {
            console.log(`📴 Client Disconnected: ${client.id}`);
        });

        // Message published
        this.broker.on("publish", async (packet, client) => {
            await this.handleMessage(packet, client);
        });

        // Client subscribed
        this.broker.on("subscribe", (subscriptions, client) => {
            console.log(
                `📬 Client ${client?.id || "system"} subscribed to: ${subscriptions.map((s) => s.topic).join(", ")}`
            );
        });

        // Client unsubscribed
        this.broker.on("unsubscribe", (subscriptions, client) => {
            console.log(
                `📭 Client ${client?.id || "system"} unsubscribed from: ${subscriptions.join(", ")}`
            );
        });
    }

    /**
     * Handle incoming MQTT message
     * @param {Object} packet - MQTT packet
     * @param {Object} client - MQTT client
     */
    async handleMessage(packet, client) {
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
     * Save sensor data to database
     * @param {string} topic - MQTT topic
     * @param {Object} data - Sensor data
     * @returns {Promise<Object>} Saved sensor data
     */
    async saveSensorData(topic, data) {
        const sensorData = new SensorData({
            topic,
            sensorId: data.sensorId || data.sensor_id || topic.split("/").pop(),
            temperature: data.temperature || data.temp,
            humidity: data.humidity,
            pressure: data.pressure,
            light: data.light,
            motion: data.motion,
            data: data,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        });

        await sensorData.save();
        console.log("💾 Saved to database");

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
        this.broker.publish(
            {
                topic,
                payload: message,
                qos: 0,
                retain: false,
            },
            (error) => {
                if (error) {
                    console.error("Error publishing message:", error);
                }
            }
        );
    }

    /**
     * Close MQTT broker
     */
    close() {
        return new Promise((resolve) => {
            if (this.server) {
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
}

module.exports = new MQTTService();
