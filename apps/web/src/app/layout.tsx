import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import Link from "next/link";
import { DisplayNameProvider } from "../contexts/DisplayNameContext";
import { MobileScaleFix } from "./components/MobileScaleFix";

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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7659818852435801"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${poppins.className} bg-gradient-to-br from-background to-background-light`}>
        <MobileScaleFix />
        <DisplayNameProvider>
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          {children}
        </DisplayNameProvider>
        <footer className="w-full border-t mt-8 py-4 text-center text-sm text-text-secondary bg-white/10 backdrop-blur-xl safe-bottom">
          <div className="container-app">
            <Link href="/about" className="hover:underline mx-2">About</Link>
            <span className="mx-1">|</span>
            <Link href="/blog" className="hover:underline mx-2">Blog</Link>
            <span className="mx-1">|</span>
            <Link href="/privacy-policy" className="hover:underline mx-2">Privacy Policy</Link>
            <span className="mx-1">|</span>
            <Link href="/terms-conditions" className="hover:underline mx-2">Terms & Conditions</Link>
            <span className="mx-1">|</span>
            <Link href="/community-guidelines" className="hover:underline mx-2">Community Guidelines</Link>
            <span className="mx-1">|</span>
            <Link href="/contact" className="hover:underline mx-2">Contact</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}

