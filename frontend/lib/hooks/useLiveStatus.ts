"use client";

import { useEffect, useState } from "react";
import { SENSOR_CONFIG } from "../constants";

/**
 * Custom hook to periodically check if data is still "live"
 * Updates component state every second to reflect data freshness
 *
 * @param timestamp - The timestamp to check
 * @param maxAgeSeconds - Maximum age in seconds to be considered live
 * @returns Boolean indicating if the data is live
 */
export function useLiveStatus(
    timestamp: string,
    maxAgeSeconds: number = SENSOR_CONFIG.LIVE_THRESHOLD_SECONDS,
): boolean {
    const [isLive, setIsLive] = useState<boolean>(true);

    useEffect(() => {
        // Function to check if data is live
        const checkLiveStatus = () => {
            const now = new Date().getTime();
            const dataTime = new Date(timestamp).getTime();
            const ageInSeconds = (now - dataTime) / 1000;

            setIsLive(ageInSeconds <= maxAgeSeconds);
        };

        // Check immediately
        checkLiveStatus();

        // Check at configured interval
        const interval = setInterval(
            checkLiveStatus,
            SENSOR_CONFIG.LIVE_CHECK_INTERVAL_MS,
        );

        // Cleanup on unmount or when timestamp changes
        return () => clearInterval(interval);
    }, [timestamp, maxAgeSeconds]);

    return isLive;
}

/**
 * Custom hook to get time ago string
 * Updates every second
 *
 * @param timestamp - The timestamp
 * @returns Human-readable time ago string
 */
export function useTimeAgo(timestamp: string): string {
    const [timeAgo, setTimeAgo] = useState<string>("");

    useEffect(() => {
        const updateTimeAgo = () => {
            const now = new Date().getTime();
            const dataTime = new Date(timestamp).getTime();
            const diffInSeconds = Math.floor((now - dataTime) / 1000);

            if (diffInSeconds < 5) {
                setTimeAgo("just now");
            } else if (diffInSeconds < 60) {
                setTimeAgo(`${diffInSeconds}s ago`);
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                setTimeAgo(`${minutes}m ago`);
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                setTimeAgo(`${hours}h ago`);
            } else {
                const days = Math.floor(diffInSeconds / 86400);
                setTimeAgo(`${days}d ago`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(
            updateTimeAgo,
            SENSOR_CONFIG.LIVE_CHECK_INTERVAL_MS,
        );

        return () => clearInterval(interval);
    }, [timestamp]);

    return timeAgo;
}
