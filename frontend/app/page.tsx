"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/useSocket";
import { groupSensorsByTopic, SensorData } from "@/lib/helpers/sensorHelpers";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardStats from "@/components/DashboardStats";
import EmptyState from "@/components/EmptyState";
import SensorGrid from "@/components/SensorGrid";
import ChartsSection from "@/components/ChartsSection";

export default function Dashboard() {
    const { connected, sensorData, latestData, error, getHistory } =
        useSocket();
    const [topics, setTopics] = useState<Map<string, SensorData>>(new Map());

    // Group sensor data by topic
    useEffect(() => {
        const topicMap = groupSensorsByTopic(sensorData);
        setTopics(topicMap);
    }, [sensorData]);

    const handleRefresh = () => {
        getHistory({ limit: 100 });
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <DashboardHeader
                connected={connected}
                error={error}
                onRefresh={handleRefresh}
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Bar */}
                <DashboardStats
                    activeTopicsCount={topics.size}
                    totalReadings={sensorData.length}
                    latestData={latestData}
                    isConnected={connected}
                />

                {/* Sensor Cards */}
                {topics.size > 0 ? (
                    <SensorGrid topics={topics} connected={connected} />
                ) : (
                    <EmptyState />
                )}

                {/* Charts */}
                {sensorData.length > 0 && (
                    <ChartsSection sensorData={sensorData} />
                )}
            </div>
        </main>
    );
}
