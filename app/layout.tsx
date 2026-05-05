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

const SITE_URL = "https://brutviz.vercel.app"; // Assuming Vercel deployment

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BrutViz | Instant Data Visualization & Analysis",
    template: "%s | BrutViz"
  },
  description: "Transform your CSV, JSON, and Excel files into professional insights instantly. Zero server, 100% private, Neo-Brutalist data analysis.",
  keywords: ["data visualization", "data analysis", "spreadsheet chart", "CSV to chart", "Excel to chart", "JSON visualizer", "Neo-Brutalist design", "serverless dashboard", "privacy-first data tools"],
  authors: [{ name: "BrutViz Team" }],
  creator: "BrutViz",
  publisher: "BrutViz",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "BrutViz",
    title: "BrutViz | Professional Data Insights in Seconds",
    description: "The world's fastest no-signup data analyzer. Visualize CSV, Excel, and JSON files instantly with maximum privacy.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BrutViz Data Visualization Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BrutViz | Instant Data Visualization",
    description: "Transform raw data into beautiful charts in seconds. No signup required.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BrutViz",
  "operatingSystem": "Web",
  "applicationCategory": "DataVisualization",
  "description": "Instant data visualization and analysis tool for CSV, Excel, and JSON files.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "No signup required",
    "Instant CSV/Excel/JSON parsing",
    "Premium Neo-Brutalist design",
    "Private client-side processing",
    "Automated AI insights",
    "Professional PDF exports"
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
