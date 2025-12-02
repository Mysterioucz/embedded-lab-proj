const SensorData = require("../models/SensorData");

/**
 * Sensor Controller
 * Handles all sensor data related requests
 */
class SensorController {
    /**
     * Get all sensor data with pagination
     * @route GET /api/sensors
     */
    async getAllSensors(req, res) {
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
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error("Error fetching sensors:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get sensor data by topic
     * @route GET /api/sensors/topic/:topic
     */
    async getSensorsByTopic(req, res) {
        try {
            const topic = req.params.topic;
            const limit = parseInt(req.query.limit) || 50;

            const data = await SensorData.find({ topic: new RegExp(topic) })
                .sort({ timestamp: -1 })
                .limit(limit);

            res.json({
                success: true,
                data,
                count: data.length,
            });
        } catch (error) {
            console.error("Error fetching sensors by topic:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get latest sensor data for each topic
     * @route GET /api/sensors/latest
     */
    async getLatestSensors(req, res) {
        try {
            const latestData = await SensorData.getLatestByTopic();

            res.json({
                success: true,
                data: latestData,
                count: latestData.length,
            });
        } catch (error) {
            console.error("Error fetching latest sensors:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get sensor statistics by topic
     * @route GET /api/sensors/stats
     */
    async getSensorStats(req, res) {
        try {
            const stats = await SensorData.getStatsByTopic();

            res.json({
                success: true,
                stats,
                count: stats.length,
            });
        } catch (error) {
            console.error("Error fetching sensor stats:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get sensor data by sensor ID
     * @route GET /api/sensors/sensor/:sensorId
     */
    async getSensorById(req, res) {
        try {
            const sensorId = req.params.sensorId;
            const limit = parseInt(req.query.limit) || 50;

            const data = await SensorData.find({ sensorId })
                .sort({ timestamp: -1 })
                .limit(limit);

            res.json({
                success: true,
                data,
                count: data.length,
            });
        } catch (error) {
            console.error("Error fetching sensor by ID:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get sensor data within date range
     * @route GET /api/sensors/range
     */
    async getSensorsByDateRange(req, res) {
        try {
            const { startDate, endDate, topic, limit = 100 } = req.query;

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

            const data = await SensorData.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit));

            res.json({
                success: true,
                data,
                count: data.length,
            });
        } catch (error) {
            console.error("Error fetching sensors by date range:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Delete old sensor data
     * @route DELETE /api/sensors/cleanup
     */
    async cleanupOldData(req, res) {
        try {
            const daysToKeep = parseInt(req.query.days) || 30;

            const result = await SensorData.cleanupOldData(daysToKeep);

            res.json({
                success: true,
                message: `Deleted ${result.deletedCount} records older than ${daysToKeep} days`,
                deletedCount: result.deletedCount,
            });
        } catch (error) {
            console.error("Error cleaning up old data:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Delete sensor data by topic
     * @route DELETE /api/sensors/topic/:topic
     */
    async deleteSensorsByTopic(req, res) {
        try {
            const topic = req.params.topic;

            const result = await SensorData.deleteMany({
                topic: new RegExp(topic),
            });

            res.json({
                success: true,
                message: `Deleted ${result.deletedCount} records for topic: ${topic}`,
                deletedCount: result.deletedCount,
            });
        } catch (error) {
            console.error("Error deleting sensors by topic:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Get total sensor count
     * @route GET /api/sensors/count
     */
    async getSensorCount(req, res) {
        try {
            const total = await SensorData.countDocuments();
            const byTopic = await SensorData.aggregate([
                {
                    $group: {
                        _id: "$topic",
                        count: { $sum: 1 },
                    },
                },
            ]);

            res.json({
                success: true,
                total,
                byTopic,
            });
        } catch (error) {
            console.error("Error fetching sensor count:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}

module.exports = new SensorController();
