"use client";

import { Activity, Database, Wifi } from "lucide-react";
import { SensorData } from "@/lib/helpers/sensorHelpers";

interface DashboardStatsProps {
  activeTopicsCount: number;
  totalReadings: number;
  latestData: SensorData | null;
  isConnected: boolean;
}

export default function DashboardStats({
  activeTopicsCount,
  totalReadings,
  latestData,
  isConnected,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Active Sensors */}
      <StatCard
        icon={<Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
        value={activeTopicsCount}
        label="Active Sensors"
        bgColor="bg-blue-100 dark:bg-blue-900/30"
      />

      {/* Total Readings */}
      <StatCard
        icon={<Database className="w-6 h-6 text-green-600 dark:text-green-400" />}
        value={totalReadings}
        label="Total Readings"
        bgColor="bg-green-100 dark:bg-green-900/30"
      />

      {/* Connection Status */}
      <StatCard
        icon={<Wifi className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
        value={latestData && isConnected ? "Live" : "Waiting"}
        label="Status"
        bgColor="bg-purple-100 dark:bg-purple-900/30"
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  bgColor: string;
}

function StatCard({ icon, value, label, bgColor }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
