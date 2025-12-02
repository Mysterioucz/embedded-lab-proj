// Test MQTT Publisher - Simulates IoT sensor data
// Usage: node test-publisher.js

const mqtt = require("mqtt");
require("dotenv").config();
const PORT = process.env.MQTT_PORT || 1883;

// MQTT Broker connection
const client = mqtt.connect(`mqtt://localhost:${PORT}`);

const PUBLISH_INTERVAL = 5000; // 5 seconds
const SENSORS = [
    {
        topic: "home/sensors/living-room",
        id: "sensor-lr-001",
        location: "Living Room",
    },
    {
        topic: "home/sensors/bedroom",
        id: "sensor-br-001",
        location: "Bedroom",
    },
    {
        topic: "home/sensors/kitchen",
        id: "sensor-kt-001",
        location: "Kitchen",
    },
];

function generateSensorData(sensor) {
    return {
        sensorId: sensor.id,
        location: sensor.location,
        temperature: parseFloat((18 + Math.random() * 12).toFixed(2)), // 18-30°C
        humidity: parseFloat((40 + Math.random() * 40).toFixed(2)), // 40-80%
        pressure: parseFloat((990 + Math.random() * 40).toFixed(2)), // 990-1030 hPa
        light: Math.floor(Math.random() * 1000), // 0-1000 lux
        motion: Math.random() > 0.7, // 30% chance of motion detected
        timestamp: new Date().toISOString(),
    };
}

client.on("connect", () => {
    console.log("✅ Connected to MQTT broker at mqtt://localhost:1883");
    console.log(
        "📡 Publishing sensor data every",
        PUBLISH_INTERVAL / 1000,
        "seconds",
    );
    console.log("📋 Topics:");
    SENSORS.forEach((sensor) => {
        console.log(`   - ${sensor.topic} (${sensor.location})`);
    });
    console.log("\n🚀 Starting data generation...\n");

    // Publish data from all sensors
    setInterval(() => {
        SENSORS.forEach((sensor) => {
            const data = generateSensorData(sensor);
            const payload = JSON.stringify(data);

            client.publish(sensor.topic, payload, (err) => {
                if (err) {
                    console.error(
                        `❌ Error publishing to ${sensor.topic}:`,
                        err,
                    );
                } else {
                    console.log(
                        `📤 [${new Date().toLocaleTimeString()}] ${sensor.topic}:`,
                    );
                    console.log(
                        `   Temperature: ${data.temperature}°C, Humidity: ${data.humidity}%, Motion: ${data.motion}`,
                    );
                }
            });
        });
        console.log(""); // Empty line for readability
    }, PUBLISH_INTERVAL);
});

// Error handler
client.on("error", (err) => {
    console.error("❌ MQTT connection error:", err.message);
    console.log(
        "\n💡 Make sure the backend server is running (pnpm run dev in backend folder)",
    );
    process.exit(1);
});

// Disconnection handler
client.on("close", () => {
    console.log("🔌 Disconnected from MQTT broker");
});

// Handle process termination
process.on("SIGINT", () => {
    console.log("\n\n⏹️  Stopping publisher...");
    client.end(true, () => {
        console.log("👋 Goodbye!");
        process.exit(0);
    });
});
