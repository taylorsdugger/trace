import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SideNav } from "@/components/SideNav";
import { TzCookie } from "@/components/TzCookie";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SwRegister } from "@/components/SwRegister";
import { normalizeTheme, THEME_COOKIE } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Trace — Cedar walks with you",
  description: "Trace your thoughts back to the root. Cedar walks with you.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#FFFCF5",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = normalizeTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row">
        <TzCookie />
        <SwRegister />
        <SideNav />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
        <ThemeToggle theme={theme} />
      </body>
    </html>
  );
}
