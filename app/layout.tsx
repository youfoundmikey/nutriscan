import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";
import SWRegister from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "NutriScan",
  description: "Scan your food, log your nutrition, eat smarter.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriScan",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f6ef",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh">
        <SWRegister />
        <main className="mx-auto w-full max-w-md px-5 pt-6 pb-32">
          {children}
        </main>
        <TabBar />
      </body>
    </html>
  );
}
