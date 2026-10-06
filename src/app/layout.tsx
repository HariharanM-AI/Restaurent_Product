import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F766E",
};

export const metadata: Metadata = {
  title: {
    template: "%s | Noura",
    default: "Noura — Smart Restaurant Guest Experience",
  },
  description: "Mobile-first hospitality experience accessed from physical restaurant table QR codes or NFC touchpoints.",
  icons: {
    icon: "/images/Own brand logo.png",
    shortcut: "/images/Own brand logo.png",
    apple: "/images/Own brand logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/Own brand logo.png" />
        <link rel="shortcut icon" href="/images/Own brand logo.png" />
        <link rel="apple-touch-icon" href="/images/Own brand logo.png" />
      </head>
      <body
        className="min-h-screen bg-surface font-sans text-foreground antialiased selection:bg-teal-100 selection:text-teal-900"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
