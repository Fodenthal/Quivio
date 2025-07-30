import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { DisplayNameProvider } from "../contexts/DisplayNameContext";
import { ThemeProvider } from "../contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

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
      <body className={`${inter.className} gradient-cursor`}>
        <ThemeProvider>
          <DisplayNameProvider>
            {children}
          </DisplayNameProvider>
          <footer className="w-full border-t border-light-border-primary dark:border-dark-border-primary mt-8 py-6 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary bg-light-background-secondary/50 dark:bg-dark-background-secondary/50 backdrop-blur-xl">
            <div className="container-cursor">
              <div className="flex items-center justify-center gap-6">
                <Link href="/about" className="hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors duration-200">About</Link>
                <span className="text-light-border-primary dark:text-dark-border-primary">•</span>
                <Link href="/privacy-policy" className="hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors duration-200">Privacy Policy</Link>
                <span className="text-light-border-primary dark:text-dark-border-primary">•</span>
                <Link href="/terms-conditions" className="hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors duration-200">Terms & Conditions</Link>
                <span className="text-light-border-primary dark:text-dark-border-primary">•</span>
                <Link href="/contact" className="hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors duration-200">Contact</Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

