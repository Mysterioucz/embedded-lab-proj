"use client";

import SensorCard from "./SensorCard";
import { SensorData } from "@/lib/helpers/sensorHelpers";

interface SensorGridProps {
  topics: Map<string, SensorData>;
}

export default function SensorGrid({ topics }: SensorGridProps) {
  if (topics.size === 0) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Current Readings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {Array.from(topics.entries()).map(([topic, data]) => (
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
