import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Bisca - Gioco di Carte Online",
  description: "Gioca a Bisca online con i tuoi amici",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bisca",
    startupImage: [
      { url: `${basePath}/icon-512.png` },
    ],
  },
  icons: {
    icon: [
      { url: `${basePath}/favicon-32x32.png`, type: "image/png", sizes: "32x32" },
      { url: `${basePath}/favicon-16x16.png`, type: "image/png", sizes: "16x16" },
      { url: `${basePath}/icon-192.png`, type: "image/png", sizes: "192x192" },
      { url: `${basePath}/icon-512.png`, type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: `${basePath}/apple-touch-icon.png`, sizes: "180x180" },
    ],
    shortcut: [{ url: `${basePath}/icon-192.png` }],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
