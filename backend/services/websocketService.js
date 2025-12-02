const SensorData = require("../models/SensorData");

class WebSocketService {
    constructor() {
        this.io = null;
    }

    /**
     * Initialize Socket.io server
     * @param {Object} io - Socket.io server instance
     */
    initialize(io) {
        this.io = io;
        this.setupConnectionHandler();
    }

    /**
     * Set up Socket.io connection handler
     */
    setupConnectionHandler() {
        this.io.on("connection", (socket) => {
            console.log(`🔌 Frontend client connected: ${socket.id}`);

            // Send initial data
            this.sendInitialData(socket);

            // Handle get history request
            socket.on("get-history", (params) => {
                this.handleGetHistory(socket, params);
            });

            // Handle disconnect
            socket.on("disconnect", () => {
                console.log(`🔌 Frontend client disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * Send initial sensor data to newly connected client
     * @param {Object} socket - Socket.io socket instance
     */
    async sendInitialData(socket) {
        try {
            const data = await SensorData.find()
                .sort({ timestamp: -1 })
                .limit(100);

            socket.emit("initial-data", data);
            console.log(`📤 Sent ${data.length} recent records to ${socket.id}`);
        } catch (error) {
            console.error("Error fetching initial data:", error);
            socket.emit("error", {
                message: "Failed to fetch initial data",
            });
        }
    }

    /**
     * Handle request for historical data
     * @param {Object} socket - Socket.io socket instance
     * @param {Object} params - Query parameters
     */
    async handleGetHistory(socket, params) {
        const { topic, startDate, endDate, limit = 100 } = params || {};

        try {
            const query = this.buildHistoryQuery(topic, startDate, endDate);
            const data = await SensorData.find(query)
                .sort({ timestamp: -1 })
                .limit(limit);

            socket.emit("history-data", data);
            console.log(`📚 Sent ${data.length} historical records to ${socket.id}`);
        } catch (error) {
            console.error("Error fetching history:", error);
            socket.emit("error", {
                message: "Failed to fetch historical data",
            });
        }
    }

    /**
     * Build query for historical data
     * @param {string} topic - MQTT topic filter
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Object} MongoDB query object
     */
    buildHistoryQuery(topic, startDate, endDate) {
        const query = {};

        if (topic) {
            query.topic = new RegExp(topic);
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        return query;
    }

    /**
     * Broadcast sensor data to all connected clients
     * @param {string} topic - MQTT topic
     * @param {Object} data - Sensor data
     */
    broadcast(topic, data) {
        if (this.io) {
            this.io.emit("sensor-data", { topic, data });
        }
    }

    /**
     * Emit event to specific socket
     * @param {string} socketId - Socket ID
     * @param {string} event - Event name
     * @param {Object} data - Data to send
     */
    emitToSocket(socketId, event, data) {
        if (this.io) {
            this.io.to(socketId).emit(event, data);
        }
    }

    /**
     * Get connected clients count
     * @returns {number} Number of connected clients
     */
    getConnectedClientsCount() {
        return this.io ? this.io.sockets.sockets.size : 0;
    }
}

module.exports = new WebSocketService();
