import type { Metadata } from "next";
import { Poppins } from "next/font/google"; // Modern, beautiful font
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
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
        className={`${poppins.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
