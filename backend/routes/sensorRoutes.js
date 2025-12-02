const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensorController");


// Get all sensors with pagination
// GET /api/sensors?page=1&limit=50
router.get("/", sensorController.getAllSensors);

// Get latest sensor data for each topic
// GET /api/sensors/latest
router.get("/latest", sensorController.getLatestSensors);

// Get sensor statistics by topic
// GET /api/sensors/stats
router.get("/stats", sensorController.getSensorStats);

// Get total sensor count
// GET /api/sensors/count
router.get("/count", sensorController.getSensorCount);

// Get sensors by date range
// GET /api/sensors/range?startDate=2024-01-01&endDate=2024-01-31&topic=home/sensors/temp
router.get("/range", sensorController.getSensorsByDateRange);

// Get sensors by topic
// GET /api/sensors/topic/:topic?limit=100
router.get("/topic/:topic", sensorController.getSensorsByTopic);

// Get sensors by sensor ID
// GET /api/sensors/sensor/:sensorId?limit=50
router.get("/sensor/:sensorId", sensorController.getSensorById);

// Delete old sensor data
// DELETE /api/sensors/cleanup?days=30
router.delete("/cleanup", sensorController.cleanupOldData);

// Delete sensors by topic
// DELETE /api/sensors/topic/:topic
router.delete("/topic/:topic", sensorController.deleteSensorsByTopic);

module.exports = router;
