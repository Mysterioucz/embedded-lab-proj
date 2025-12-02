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
  const hasData = temperature !== undefined || humidity !== undefined || pressure !== undefined || light !== undefined || motion !== undefined;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{topic}</p>
          {sensorId && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ID: {sensorId}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
        </div>
      </div>

      {hasData ? (
        <div className="grid grid-cols-2 gap-4">
          {temperature !== undefined && (
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {temperature.toFixed(1)}°C
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Temperature</p>
              </div>
            </div>
          )}

          {humidity !== undefined && (
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {humidity.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Humidity</p>
              </div>
            </div>
          )}

          {pressure !== undefined && (
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {pressure.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pressure (hPa)</p>
              </div>
            </div>
          )}

          {light !== undefined && (
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {light.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Light (lux)</p>
              </div>
            </div>
          )}

          {motion !== undefined && (
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {motion ? "Detected" : "None"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Motion</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-400 dark:text-gray-500">No sensor data available</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {format(new Date(timestamp), "PPpp")}
        </p>
      </div>
    </div>
  );
}
