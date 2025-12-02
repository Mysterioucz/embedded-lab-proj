"use client";

import { Thermometer, Droplets, Gauge, Sun, Activity } from "lucide-react";
import { format } from "date-fns";

interface SensorCardProps {
    title: string;
    topic: string;
    temperature?: number;
    humidity?: number;
    pressure?: number;
    light?: number;
    motion?: boolean;
    timestamp: string;
    sensorId?: string;
}

export default function SensorCard({
    title,
    topic,
    temperature,
    humidity,
    pressure,
    light,
    motion,
    timestamp,
    sensorId,
}: SensorCardProps) {
    const hasData = hasAnyReading(
        temperature,
        humidity,
        pressure,
        light,
        motion,
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <CardHeader title={title} topic={topic} sensorId={sensorId} />

            {hasData ? (
                <ReadingsGrid
                    temperature={temperature}
                    humidity={humidity}
                    pressure={pressure}
                    light={light}
                    motion={motion}
                />
            ) : (
                <NoDataMessage />
            )}

            <CardFooter timestamp={timestamp} />
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    topic: string;
    sensorId?: string;
}

function CardHeader({ title, topic, sensorId }: CardHeaderProps) {
    return (
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {topic}
                </p>
                {sensorId && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        ID: {sensorId}
                    </p>
                )}
            </div>
            <LiveIndicator />
        </div>
    );
}

function LiveIndicator() {
    return (
        <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
                Live
            </span>
        </div>
    );
}

interface ReadingsGridProps {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    light?: number;
    motion?: boolean;
}

function ReadingsGrid({
    temperature,
    humidity,
    pressure,
    light,
    motion,
}: ReadingsGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {temperature !== undefined && (
                <Reading
                    icon={<Thermometer className="w-5 h-5 text-red-500" />}
                    value={`${temperature.toFixed(1)}°C`}
                    label="Temperature"
                />
            )}

            {humidity !== undefined && (
                <Reading
                    icon={<Droplets className="w-5 h-5 text-blue-500" />}
                    value={`${humidity.toFixed(1)}%`}
                    label="Humidity"
                />
            )}

            {pressure !== undefined && (
                <Reading
                    icon={<Gauge className="w-5 h-5 text-purple-500" />}
                    value={pressure.toFixed(0)}
                    label="Pressure (hPa)"
                />
            )}

            {light !== undefined && (
                <Reading
                    icon={<Sun className="w-5 h-5 text-yellow-500" />}
                    value={light.toFixed(0)}
                    label="Light (lux)"
                />
            )}

            {motion !== undefined && (
                <Reading
                    icon={<Activity className="w-5 h-5 text-orange-500" />}
                    value={motion ? "Detected" : "None"}
                    label="Motion"
                />
            )}
        </div>
    );
}

interface ReadingProps {
    icon: React.ReactNode;
    value: string;
    label: string;
}

function Reading({ icon, value, label }: ReadingProps) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                </p>
            </div>
        </div>
    );
}

function NoDataMessage() {
    return (
        <div className="text-center py-4">
            <p className="text-gray-400 dark:text-gray-500">
                No sensor data available
            </p>
        </div>
    );
}

interface CardFooterProps {
    timestamp: string;
}

function CardFooter({ timestamp }: CardFooterProps) {
    return (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {format(new Date(timestamp), "PPpp")}
            </p>
        </div>
    );
}

function hasAnyReading(
    temperature?: number,
    humidity?: number,
    pressure?: number,
    light?: number,
    motion?: boolean,
): boolean {
    return (
        temperature !== undefined ||
        humidity !== undefined ||
        pressure !== undefined ||
        light !== undefined ||
        motion !== undefined
    );
}
