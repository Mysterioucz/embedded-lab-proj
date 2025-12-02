require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/iot-sensors";

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

/**
 * Close database connection
 * @returns {Promise<void>}
 */
const closeDatabase = async () => {
    try {
        await mongoose.connection.close();
        console.log("🔒 MongoDB connection closed");
    } catch (error) {
        console.error("Error closing database:", error.message);
    }
};

// Handle connection events
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
});

module.exports = {
    connectDatabase,
    closeDatabase,
    mongoose,
};
