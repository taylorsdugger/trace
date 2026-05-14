import type { Metadata } from "next";
import { Geist, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SideNav } from "@/components/SideNav";
import { TzCookie } from "@/components/TzCookie";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Trace",
  description: "Trace: CBT Journal with Memory",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#F7F2E8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row">
        <TzCookie />
        <SideNav />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </body>
    </html>
  );
}
