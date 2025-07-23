import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "PopReplay",
  description: "A multiplayer trivia game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-gradient-to-br from-background to-background-light`}>
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

