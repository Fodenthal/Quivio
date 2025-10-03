import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { DisplayNameProvider } from "../contexts/DisplayNameContext";
import { GameConnectionProvider } from "../contexts/GameConnectionContext";
import { MobileScaleFix } from "./components/MobileScaleFix";
import { DebugTools } from "./components/DebugTools";
import Script from "next/script";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "Quivio",
  description: "A multiplayer trivia game",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7659818852435801"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      </head>
      <body className={`${poppins.className} bg-gradient-to-br from-background to-background-light`}>
        <MobileScaleFix />
        <DisplayNameProvider>
          <GameConnectionProvider>
            <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
            <DebugTools />
            {children}
          </GameConnectionProvider>
        </DisplayNameProvider>
      </body>
    </html>
  );
}

