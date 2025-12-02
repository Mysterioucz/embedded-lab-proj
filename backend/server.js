require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const aedes = require("aedes");
const net = require("net");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/iot-sensors";
mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// Define Sensor Data Schema
const sensorDataSchema = new mongoose.Schema({
    topic: { type: String, required: true, index: true },
    sensorId: String,
    temperature: Number,
    humidity: Number,
    pressure: Number,
    light: Number,
    motion: Boolean,
    data: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now, index: true },
});

const SensorData = mongoose.model("SensorData", sensorDataSchema);

// Initialize MQTT Broker (Aedes)
const mqttBroker = aedes();
const mqttPort = process.env.MQTT_PORT || 1883;

// Create MQTT server
const mqttServer = net.createServer(mqttBroker.handle);

mqttServer.listen(mqttPort, () => {
    console.log(`🚀 MQTT Broker running on port ${mqttPort}`);
});

// MQTT Broker Events
mqttBroker.on("client", (client) => {
    console.log(`📱 Client Connected: ${client.id}`);
});

mqttBroker.on("clientDisconnect", (client) => {
    console.log(`📴 Client Disconnected: ${client.id}`);
});

mqttBroker.on("publish", async (packet, client) => {
    // Skip system topics
    if (packet.topic.startsWith("$SYS")) return;

    const topic = packet.topic;
    const message = packet.payload.toString();

    console.log(`📩 Received on topic "${topic}":`, message);

    try {
        // Parse the JSON message
        const data = JSON.parse(message);

        // Create sensor data document
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

        // Save to MongoDB
        await sensorData.save();
        console.log("💾 Saved to database");

        // Emit to all connected Socket.io clients
        io.emit("sensor-data", {
            topic,
            data: sensorData,
        });
        console.log("📡 Broadcast to frontend clients");
    } catch (error) {
        console.error("❌ Error processing message:", error.message);
    }
});

// Socket.io Connection Handler
io.on("connection", (socket) => {
    console.log(`🔌 Frontend client connected: ${socket.id}`);

    // Send recent sensor data on connection
    SensorData.find()
        .sort({ timestamp: -1 })
        .limit(50)
        .then((data) => {
            socket.emit("initial-data", data);
            console.log(
                `📤 Sent ${data.length} recent records to ${socket.id}`,
            );
        })
        .catch((err) => console.error("Error fetching initial data:", err));

    socket.on("disconnect", () => {
        console.log(`🔌 Frontend client disconnected: ${socket.id}`);
    });

    // Handle request for historical data
    socket.on(
        "get-history",
        async ({ topic, startDate, endDate, limit = 100 }) => {
            try {
                const query = {};
                if (topic) query.topic = new RegExp(topic);
                if (startDate || endDate) {
                    query.timestamp = {};
                    if (startDate) query.timestamp.$gte = new Date(startDate);
                    if (endDate) query.timestamp.$lte = new Date(endDate);
                }

                const data = await SensorData.find(query)
                    .sort({ timestamp: -1 })
                    .limit(limit);

                socket.emit("history-data", data);
            } catch (error) {
                console.error("Error fetching history:", error);
                socket.emit("error", {
                    message: "Failed to fetch historical data",
                });
            }
        },
    );
});

// REST API Endpoints

// Health check
app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "IoT Sensor Backend",
        mqtt: `mqtt://localhost:${mqttPort}`,
        mongodb:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

// Get all sensor data with pagination
app.get("/api/sensors", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const data = await SensorData.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await SensorData.countDocuments();

        res.json({
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sensor data by topic
app.get("/api/sensors/topic/:topic", async (req, res) => {
    try {
        const topic = req.params.topic;
        const limit = parseInt(req.query.limit) || 50;

        const data = await SensorData.find({ topic: new RegExp(topic) })
            .sort({ timestamp: -1 })
            .limit(limit);

        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get latest sensor data
app.get("/api/sensors/latest", async (req, res) => {
    try {
        // Get the latest reading for each unique topic
        const latestData = await SensorData.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: "$topic",
                    latestData: { $first: "$$ROOT" },
                },
            },
            { $replaceRoot: { newRoot: "$latestData" } },
        ]);

        res.json({ data: latestData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sensor statistics
app.get("/api/sensors/stats", async (req, res) => {
    try {
        const stats = await SensorData.aggregate([
            {
                $group: {
                    _id: "$topic",
                    count: { $sum: 1 },
                    avgTemperature: { $avg: "$temperature" },
                    avgHumidity: { $avg: "$humidity" },
                    avgPressure: { $avg: "$pressure" },
                    lastUpdate: { $max: "$timestamp" },
                },
            },
        ]);

        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete old sensor data (cleanup endpoint)
app.delete("/api/sensors/cleanup", async (req, res) => {
    try {
        const daysToKeep = parseInt(req.query.days) || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await SensorData.deleteMany({
            timestamp: { $lt: cutoffDate },
        });

        res.json({
            message: `Deleted ${result.deletedCount} records older than ${daysToKeep} days`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start HTTP server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 HTTP Server running on port ${PORT}`);
    console.log(`📊 REST API: http://localhost:${PORT}/api/sensors`);
    console.log(`🔌 Socket.io ready for frontend connections`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
        console.log("HTTP server closed");
        mongoose.connection.close(false, () => {
            console.log("MongoDB connection closed");
            process.exit(0);
        });
    });
});
