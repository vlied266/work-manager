import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AICopilot from "@/components/layout/AICopilot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Work - The Atomic Engine",
  description: "B2B Process Execution Engine",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Atomic Work",
  },
  icons: {
    icon: "/apple-icon.png", // Fallback for standard favicon
    apple: "/apple-icon.png", // Specific for iOS
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <AICopilot />
      </body>
    </html>
  );
}

