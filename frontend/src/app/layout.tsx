import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import LayoutClient from "@/components/LayoutClient";
import TerrainLines from "@/components/TerrainLines";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemoMind | Organizational Memory Intelligence",
  description: "Futuristic, long-term AI-powered memory Layer for meetings, decisions, tasks, circular discussions, and contradiction logs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full text-foreground bg-[var(--background)] flex overflow-hidden`}>
        <ThemeProvider attribute="data-theme" defaultTheme="dark">
          <TerrainLines />
          <AuthProvider>
            <LayoutClient>
              {children}
            </LayoutClient>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
