"use client";

import { Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
    connected: boolean;
    error: string | null;
    onRefresh: () => void;
}

export default function DashboardHeader({
    connected,
    error,
    onRefresh,
}: DashboardHeaderProps) {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex justify-between items-center">
                    {/* Title Section */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-8 h-8" />
                            IoT Sensor Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Real-time monitoring via MQTT & Socket.io
                        </p>
                    </div>

                    {/* Controls Section */}
                    <div className="flex items-center gap-4">
                        {/* Connection Status */}
                        <ConnectionStatus connected={connected} />

                        {/* Refresh Button */}
                        <button
                            onClick={onRefresh}
                            disabled={!connected}
                            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            title="Refresh data"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && <ErrorBanner message={error} />}
            </div>
        </header>
    );
}

interface ConnectionStatusProps {
    connected: boolean;
}

function ConnectionStatus({ connected }: ConnectionStatusProps) {
    return (
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
    );
}

interface ErrorBannerProps {
    message: string;
}

function ErrorBanner({ message }: ErrorBannerProps) {
    return (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">
                ⚠️ {message}
            </p>
        </div>
    );
}
