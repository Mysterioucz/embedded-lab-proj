/**
 * Application Constants
 * Centralized configuration values
 */

/**
 * Sensor live status configuration
 */
export const SENSOR_CONFIG = {
    /**
     * Maximum age in seconds for data to be considered "live"
     * After this time, the sensor will show as "Offline"
     */
    LIVE_THRESHOLD_SECONDS: 30,

    /**
     * How often to check live status (milliseconds)
     */
    LIVE_CHECK_INTERVAL_MS: 1000,

    /**
     * Maximum number of data points to display in charts
     */
    MAX_CHART_DATA_POINTS: 50,

    /**
     * Default number of historical records to fetch
     */
    DEFAULT_HISTORY_LIMIT: 100,
};

/**
 * WebSocket configuration
 */
export const WEBSOCKET_CONFIG = {
    /**
     * Default Socket.io server URL
     */
    DEFAULT_SERVER_URL: "http://localhost:4000",

    /**
     * Socket.io reconnection settings
     */
    RECONNECTION_DELAY_MS: 1000,
    RECONNECTION_ATTEMPTS: 5,
};

/**
 * UI configuration
 */
export const UI_CONFIG = {
    /**
     * Debounce delay for search/filter inputs
     */
    DEBOUNCE_DELAY_MS: 300,

    /**
     * Toast notification duration
     */
    TOAST_DURATION_MS: 3000,

    /**
     * Animation durations
     */
    ANIMATION_DURATION_MS: 200,
};

/**
 * Data refresh configuration
 */
export const REFRESH_CONFIG = {
    /**
     * Auto-refresh interval (0 = disabled)
     */
    AUTO_REFRESH_INTERVAL_MS: 0,

    /**
     * Minimum time between manual refreshes
     */
    MIN_REFRESH_INTERVAL_MS: 1000,
};

/**
 * Color palette for sensor types
 */
export const SENSOR_COLORS = {
    temperature: {
        primary: "#EF4444",
        light: "#FEE2E2",
        dark: "#7F1D1D",
    },
    humidity: {
        primary: "#3B82F6",
        light: "#DBEAFE",
        dark: "#1E3A8A",
    },
    pressure: {
        primary: "#8B5CF6",
        light: "#EDE9FE",
        dark: "#4C1D95",
    },
    light: {
        primary: "#F59E0B",
        light: "#FEF3C7",
        dark: "#78350F",
    },
    motion: {
        primary: "#F97316",
        light: "#FFEDD5",
        dark: "#7C2D12",
    },
};

/**
 * Chart configuration
 */
export const CHART_CONFIG = {
    /**
     * Default chart height in pixels
     */
    DEFAULT_HEIGHT: 300,

    /**
     * Chart margins
     */
    MARGINS: {
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
    },

    /**
     * Grid style
     */
    GRID: {
        strokeDasharray: "3 3",
        opacity: 0.1,
    },
};

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
    SENSORS: "/api/sensors",
    SENSORS_LATEST: "/api/sensors/latest",
    SENSORS_STATS: "/api/sensors/stats",
    SENSORS_COUNT: "/api/sensors/count",
    SENSORS_BY_TOPIC: (topic: string) => `/api/sensors/topic/${topic}`,
    SENSORS_BY_ID: (id: string) => `/api/sensors/sensor/${id}`,
    SENSORS_RANGE: "/api/sensors/range",
    SENSORS_CLEANUP: "/api/sensors/cleanup",
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
    THEME: "iot-dashboard-theme",
    PREFERENCES: "iot-dashboard-preferences",
    RECENT_TOPICS: "iot-dashboard-recent-topics",
};

/**
 * Time format strings
 */
export const TIME_FORMATS = {
    FULL: "PPpp", // Jan 1, 2024, 12:00:00 PM
    DATE: "PP", // Jan 1, 2024
    TIME: "p", // 12:00 PM
    SHORT: "MMM d, HH:mm", // Jan 1, 12:00
    CHART: "HH:mm:ss", // 12:00:00
};
