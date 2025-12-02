const mongoose = require("mongoose");

/**
 * Sensor Data Schema
 * Stores all sensor readings from IoT devices
 */
const sensorDataSchema = new mongoose.Schema(
    {
        topic: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },
        sensorId: {
            type: String,
            trim: true,
            index: true,
        },
        temperature: {
            type: Number,
            min: -273.15, // Absolute zero
            max: 1000,
        },
        humidity: {
            type: Number,
            min: 0,
            max: 100,
        },
        pressure: {
            type: Number,
            min: 0,
            max: 2000,
        },
        light: {
            type: Number,
            min: 0,
        },
        motion: {
            type: Boolean,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Index for efficient queries
sensorDataSchema.index({ topic: 1, timestamp: -1 });
sensorDataSchema.index({ sensorId: 1, timestamp: -1 });

/**
 * Get latest reading for each unique topic
 * @returns {Promise<Array>}
 */
sensorDataSchema.statics.getLatestByTopic = async function () {
    return this.aggregate([
        { $sort: { timestamp: -1 } },
        {
            $group: {
                _id: "$topic",
                latestData: { $first: "$$ROOT" },
            },
        },
        { $replaceRoot: { newRoot: "$latestData" } },
    ]);
};

/**
 * Get statistics by topic
 * @returns {Promise<Array>}
 */
sensorDataSchema.statics.getStatsByTopic = async function () {
    return this.aggregate([
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
};

/**
 * Delete old records
 * @param {number} days - Number of days to keep
 * @returns {Promise<Object>}
 */
sensorDataSchema.statics.cleanupOldData = async function (days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.deleteMany({
        timestamp: { $lt: cutoffDate },
    });
};

const SensorData = mongoose.model("SensorData", sensorDataSchema);

module.exports = SensorData;
