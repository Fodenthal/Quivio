import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { UserDisplayName } from "./components/UserDisplayName";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "Quivio",
  description: "A multiplayer trivia game",
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
        <div className="w-full flex justify-end items-center h-16 px-8">
          <UserDisplayName />
        </div>
        {children}
        <footer className="w-full border-t mt-8 py-4 text-center text-sm text-gray-500 bg-white/80">
          <Link href="/about" className="hover:underline mx-2">About</Link>|
          <Link href="/privacy-policy" className="hover:underline mx-2">Privacy Policy</Link>|
          <Link href="/terms-conditions" className="hover:underline mx-2">Terms & Conditions</Link>|
          <Link href="/contact" className="hover:underline mx-2">Contact</Link>
        </footer>
      </body>
    </html>
  );
}

