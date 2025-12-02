"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface SensorData {
  _id: string;
  topic: string;
  sensorId?: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  light?: number;
  motion?: boolean;
  data: any;
  timestamp: string;
}

interface SensorChartProps {
  data: SensorData[];
  dataKey: "temperature" | "humidity" | "pressure" | "light";
  title: string;
  color?: string;
  unit?: string;
}

export default function SensorChart({
  data,
  dataKey,
  title,
  color = "#8884d8",
  unit = "",
}: SensorChartProps) {
  // Filter and format data for the chart
  const chartData = data
    .filter((item) => item[dataKey] !== undefined && item[dataKey] !== null)
    .reverse() // Show oldest to newest
    .slice(-50) // Show last 50 data points
    .map((item) => ({
      timestamp: format(new Date(item.timestamp), "HH:mm:ss"),
      value: item[dataKey],
      fullTimestamp: item.timestamp,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {title}
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400 dark:text-gray-500">
            No data available for {title.toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="timestamp"
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6B7280" }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6B7280" }}
            label={{
              value: unit,
              angle: -90,
              position: "insideLeft",
              style: { fill: "#6B7280" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#F3F4F6",
            }}
            labelStyle={{ color: "#9CA3AF" }}
            formatter={(value: any) => [
              `${Number(value).toFixed(2)} ${unit}`,
              title,
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "14px", color: "#6B7280" }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Showing last {chartData.length} readings</span>
        <span>
          Latest: {chartData[chartData.length - 1]?.value?.toFixed(2)} {unit}
        </span>
      </div>
    </div>
  );
}
