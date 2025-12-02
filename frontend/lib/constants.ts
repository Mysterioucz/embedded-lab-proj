export const SENSOR_CONFIG = {
    LIVE_THRESHOLD_SECONDS: 30,
    LIVE_CHECK_INTERVAL_MS: 1000,
    MAX_CHART_DATA_POINTS: 50,
    DEFAULT_HISTORY_LIMIT: 100,
};

// UI configuration
export const UI_CONFIG = {
    DEBOUNCE_DELAY_MS: 300,
    TOAST_DURATION_MS: 3000,
    ANIMATION_DURATION_MS: 200,
};

// Data refresh configuration
export const REFRESH_CONFIG = {
    AUTO_REFRESH_INTERVAL_MS: 0,
    MIN_REFRESH_INTERVAL_MS: 1000,
};

// Chart configuration
export const CHART_CONFIG = {
    DEFAULT_HEIGHT: 300,
    MARGINS: {
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
    },
    GRID: {
        strokeDasharray: "3 3",
        opacity: 0.1,
    },
};

// API endpoints
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

// Local storage keys
export const STORAGE_KEYS = {
    THEME: "iot-dashboard-theme",
    PREFERENCES: "iot-dashboard-preferences",
    RECENT_TOPICS: "iot-dashboard-recent-topics",
};

export const TIME_FORMATS = {
    FULL: "PPpp", // Jan 1, 2024, 12:00:00 PM
    DATE: "PP", // Jan 1, 2024
    TIME: "p", // 12:00 PM
    SHORT: "MMM d, HH:mm", // Jan 1, 12:00
    CHART: "HH:mm:ss", // 12:00:00
};
