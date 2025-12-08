"use client";

import SensorCard from "./SensorCard";
import { SensorData, isDataLive } from "@/lib/helpers/sensorHelpers";

interface SensorGridProps {
    topics: Map<string, SensorData>;
    connected: boolean;
}

export default function SensorGrid({ topics, connected }: SensorGridProps) {
    if (topics.size === 0) {
        return null;
    }

    return (
        <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Current Readings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {Array.from(topics.entries())
                    .sort(([topicA], [topicB]) => topicA.localeCompare(topicB))
                    .map(([topic, data]) => (
                        <SensorCard
                            key={topic}
                            title={getSensorTitle(topic)}
                            topic={topic}
                            temperature={data.temperature}
                            humidity={data.humidity}
                            pressure={data.pressure}
                            light={data.light}
                            motion={data.motion}
                            timestamp={data.timestamp}
                            sensorId={data.sensorId}
                            isLive={isDataLive(data.timestamp)}
                        />
                    ))}
            </div>
        </>
    );
}

function getSensorTitle(topic: string): string {
    const parts = topic.split("/");
    return parts[parts.length - 1] || "Sensor";
}
