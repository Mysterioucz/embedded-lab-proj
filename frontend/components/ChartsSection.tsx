"use client";

import SensorChart from "./SensorChart";
import { SensorData } from "@/lib/helpers/sensorHelpers";

interface ChartsSectionProps {
    sensorData: SensorData[];
}

export default function ChartsSection({ sensorData }: ChartsSectionProps) {
    if (sensorData.length === 0) {
        return null;
    }

    return (
        <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Historical Data
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SensorChart
                    data={sensorData}
                    dataKey="temperature"
                    title="Temperature"
                    color="#EF4444"
                    unit="°C"
                />
                <SensorChart
                    data={sensorData}
                    dataKey="humidity"
                    title="Humidity"
                    color="#3B82F6"
                    unit="%"
                />
                <SensorChart
                    data={sensorData}
                    dataKey="light"
                    title="Light"
                    color="#F59E0B"
                    unit="lux"
                />
            </div>
        </>
    );
}
