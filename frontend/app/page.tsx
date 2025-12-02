"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/useSocket";
import SensorCard from "@/components/SensorCard";
import SensorChart from "@/components/SensorChart";
import { Activity, Wifi, WifiOff, Database, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { connected, sensorData, latestData, error, getHistory } = useSocket();
  const [topics, setTopics] = useState<Map<string, any>>(new Map());

  // Group sensor data by topic
  useEffect(() => {
    const topicMap = new Map();

    // Get the latest reading for each unique topic
    sensorData.forEach((data) => {
      if (!topicMap.has(data.topic)) {
        topicMap.set(data.topic, data);
      }
    });

    setTopics(topicMap);
  }, [sensorData]);

  const handleRefresh = () => {
    getHistory({ limit: 100 });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-8 h-8" />
                IoT Sensor Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Real-time monitoring via MQTT & Socket.io
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                {connected ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Disconnected
                    </span>
                  </>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={!connected}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                ⚠️ {error}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {topics.size}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Active Sensors
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sensorData.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Readings
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {latestData ? "Live" : "Waiting"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Cards */}
        {topics.size > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Current Readings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {Array.from(topics.entries()).map(([topic, data]) => (
                <SensorCard
                  key={topic}
                  title={topic.split("/").pop() || "Sensor"}
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
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center mb-12">
            <Activity className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Waiting for sensor data...
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Make sure your sensors are publishing to the MQTT broker at{" "}
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                mqtt://localhost:1883
              </code>
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Example topic: <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">home/sensors/temperature</code>
            </p>
          </div>
        )}

        {/* Charts */}
        {sensorData.length > 0 && (
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
                dataKey="pressure"
                title="Pressure"
                color="#8B5CF6"
                unit="hPa"
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
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            IoT Sensor Dashboard powered by Next.js, Node.js, MQTT & Socket.io
          </p>
        </div>
      </footer>
    </main>
  );
}
