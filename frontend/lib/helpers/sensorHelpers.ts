/**
 * Sensor Data Helper Utilities
 * Helper functions for processing and grouping sensor data
 */

import { SENSOR_CONFIG } from "../constants";

export interface SensorData {
    _id: string;
    topic: string;
    sensorId?: string;
    temperature?: number;
    humidity?: number;
    pressure?: number;
    light?: number;
    motion?: boolean;
    data: any;
    timestamp: string;
}

/**
 * Group sensor data by topic, keeping only the latest reading
 * @param sensorData - Array of sensor readings
 * @returns Map of topics to their latest sensor data
 */
export function groupSensorsByTopic(
    sensorData: SensorData[],
): Map<string, SensorData> {
    const topicMap = new Map<string, SensorData>();

    sensorData.forEach((data) => {
        if (!topicMap.has(data.topic)) {
            topicMap.set(data.topic, data);
        }
    });

    return topicMap;
}

/**
 * Extract sensor name from topic
 * @param topic - MQTT topic string
 * @returns Sensor name
 */
export function getSensorNameFromTopic(topic: string): string {
    const parts = topic.split("/");
    return parts[parts.length - 1] || "Unknown Sensor";
}

/**
 * Check if sensor data has any readings
 * @param data - Sensor data object
 * @returns Boolean indicating if data exists
 */
export function hasAnyReading(data: SensorData): boolean {
    return (
        data.temperature !== undefined ||
        data.humidity !== undefined ||
        data.pressure !== undefined ||
        data.light !== undefined ||
        data.motion !== undefined
    );
}

/**
 * Format sensor value with unit
 * @param value - Numeric value
 * @param type - Sensor type
 * @returns Formatted string with unit
 */
export function formatSensorValue(
    value: number | undefined,
    type: "temperature" | "humidity" | "pressure" | "light",
): string {
    if (value === undefined) return "N/A";

    switch (type) {
        case "temperature":
            return `${value.toFixed(1)}°C`;
        case "humidity":
            return `${value.toFixed(1)}%`;
        case "pressure":
            return `${value.toFixed(0)} hPa`;
        case "light":
            return `${value.toFixed(0)} lux`;
        default:
            return value.toString();
    }
}

/**
 * Get color for sensor type
 * @param type - Sensor type
 * @returns Tailwind color class
 */
export function getSensorColor(
    type: "temperature" | "humidity" | "pressure" | "light" | "motion",
): string {
    const colors = {
        temperature: "text-red-500",
        humidity: "text-blue-500",
        pressure: "text-purple-500",
        light: "text-yellow-500",
        motion: "text-orange-500",
    };

    return colors[type] || "text-gray-500";
}

/**
 * Calculate statistics for sensor readings
 * @param data - Array of sensor readings
 * @param field - Field to calculate stats for
 * @returns Statistics object
 */
export function calculateStats(
    data: SensorData[],
    field: keyof SensorData,
): {
    min: number;
    max: number;
    avg: number;
    count: number;
} {
    const values = data
        .map((d) => d[field] as number)
        .filter((v) => v !== undefined && !isNaN(v));

    if (values.length === 0) {
        return { min: 0, max: 0, avg: 0, count: 0 };
    }

    return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
    };
}

/**
 * Filter sensor data by time range
 * @param data - Array of sensor readings
 * @param minutes - Number of minutes to filter
 * @returns Filtered sensor data
 */
export function filterByTimeRange(
    data: SensorData[],
    minutes: number,
): SensorData[] {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    return data.filter((d) => new Date(d.timestamp) >= cutoffTime);
}

/**
 * Sort sensor data by timestamp
 * @param data - Array of sensor readings
 * @param ascending - Sort order
 * @returns Sorted sensor data
 */
export function sortByTimestamp(
    data: SensorData[],
    ascending: boolean = false,
): SensorData[] {
    return [...data].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return ascending ? timeA - timeB : timeB - timeA;
    });
}

/**
 * Check if sensor data is live (recent)
 * @param timestamp - Sensor data timestamp
 * @param maxAgeSeconds - Maximum age in seconds to be considered live
 * @returns Boolean indicating if data is live
 */
export function isDataLive(
    timestamp: string,
    maxAgeSeconds: number = SENSOR_CONFIG.LIVE_THRESHOLD_SECONDS,
): boolean {
    const now = new Date().getTime();
    const dataTime = new Date(timestamp).getTime();
    const ageInSeconds = (now - dataTime) / 1000;

    return ageInSeconds <= maxAgeSeconds;
}
