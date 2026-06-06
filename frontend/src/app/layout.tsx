// Vercel deployment trigger comment
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import LayoutClient from "@/components/LayoutClient";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemoMind | Memory Intelligence",
  description: "Modern team memory layer for decisions and action items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased h-full text-[var(--color-body)] bg-[var(--color-bg-main)] flex overflow-hidden`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <LayoutClient>
              {children}
            </LayoutClient>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
