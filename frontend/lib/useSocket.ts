"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

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

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  sensorData: SensorData[];
  latestData: SensorData | null;
  error: string | null;
  getHistory: (params: HistoryParams) => void;
}

interface HistoryParams {
  topic?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("✅ Connected to Socket.io server");
      setConnected(true);
      setError(null);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.io server");
      setConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });

    // Listen for initial data (historical)
    socketInstance.on("initial-data", (data: SensorData[]) => {
      console.log(`📊 Received ${data.length} initial records`);
      setSensorData(data);
      if (data.length > 0) {
        setLatestData(data[0]);
      }
    });

    // Listen for real-time sensor data
    socketInstance.on("sensor-data", ({ topic, data }: { topic: string; data: SensorData }) => {
      console.log(`📡 New sensor data on topic: ${topic}`);

      // Add new data to the beginning of the array
      setSensorData((prev) => {
        const newData = [data, ...prev];
        // Keep only the last 100 records in memory
        return newData.slice(0, 100);
      });

      setLatestData(data);
    });

    // Listen for historical data response
    socketInstance.on("history-data", (data: SensorData[]) => {
      console.log(`📚 Received ${data.length} historical records`);
      setSensorData(data);
      if (data.length > 0) {
        setLatestData(data[0]);
      }
    });

    // Listen for errors
    socketInstance.on("error", (err: { message: string }) => {
      console.error("Socket error:", err.message);
      setError(err.message);
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 Disconnecting socket");
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  const getHistory = useCallback(
    (params: HistoryParams) => {
      if (socketRef.current && connected) {
        console.log("📥 Requesting historical data:", params);
        socketRef.current.emit("get-history", params);
      } else {
        console.warn("Cannot request history: Socket not connected");
      }
    },
    [connected]
  );

  return {
    socket,
    connected,
    sensorData,
    latestData,
    error,
    getHistory,
  };
}
