import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Modern, clean font
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "BrutViz | Instant Data Visualization & Analysis",
  description: "Transform your CSV, JSON, and Excel files into professional insights instantly. Zero server, 100% private, Neo-Brutalist data analysis.",
  keywords: ["data visualization", "data analysis", "spreadsheet chart", "CSV to chart", "Neo-Brutalist design", "serverless dashboard"],
  authors: [{ name: "BrutViz Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
