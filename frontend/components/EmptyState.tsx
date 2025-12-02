"use client";

import { Activity } from "lucide-react";

export default function EmptyState() {
  return (
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
      <div className="mt-6 space-y-2">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Example topic:{" "}
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            home/sensors/temperature
          </code>
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Or run the test publisher:{" "}
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            pnpm run test:publisher
          </code>
        </p>
      </div>
    </div>
  );
}
