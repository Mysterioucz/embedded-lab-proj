require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Import configurations and services
const { connectDatabase, closeDatabase } = require("./config/database");
const mqttService = require("./services/mqttService");
const websocketService = require("./services/websocketService");

// Import routes
const sensorRoutes = require("./routes/sensorRoutes");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "IoT Sensor Backend",
        version: "2.0.0",
        mqtt: `mqtt://localhost:${process.env.MQTT_PORT || 1883}`,
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use("/api/sensors", sensorRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: err.message,
    });
});

/**
 * Initialize all services
 */
async function initializeServices() {
    try {
        // Connect to database
        await connectDatabase();

        // Initialize WebSocket service
        websocketService.initialize(io);

        // Initialize MQTT service
        mqttService.initialize(io);

        console.log("✅ All services initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize services:", error);
        process.exit(1);
    }
}

/**
 * Start the server
 */
async function startServer() {
    const PORT = process.env.PORT || 4000;

    // Initialize services first
    await initializeServices();

    // Start HTTP server
    server.listen(PORT, () => {
        console.log("\n" + "=".repeat(60));
        console.log("🚀 IoT Sensor Backend Server Started");
        console.log("=".repeat(60));
        console.log(`📡 HTTP Server:     http://localhost:${PORT}`);
        console.log(`🔌 Socket.io:       ws://localhost:${PORT}`);
        console.log(`📊 REST API:        http://localhost:${PORT}/api/sensors`);
        console.log(
            `🌐 Frontend URL:    ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
        );
        console.log("=".repeat(60) + "\n");
    });
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
    console.log(`\n${signal} signal received: closing services...`);

    try {
        // Close HTTP server
        await new Promise((resolve) => {
            server.close(() => {
                console.log("✅ HTTP server closed");
                resolve();
            });
        });

        // Close MQTT broker
        await mqttService.close();

        // Close database connection
        await closeDatabase();

        console.log("👋 Graceful shutdown completed");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
});

// Start the server
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
