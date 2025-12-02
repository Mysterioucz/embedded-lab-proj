import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "IoT Sensor Dashboard",
    description:
        "Real-time IoT sensor monitoring dashboard with MQTT and Socket.io",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased flex flex-col">
                {children}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        IoT Sensor Dashboard powered by Next.js, Node.js, MQTT &
                        Socket.io
                    </p>
                </div>
            </body>
        </html>
    );
}
