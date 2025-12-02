import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT Sensor Dashboard",
  description: "Real-time IoT sensor monitoring dashboard with MQTT and Socket.io",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
