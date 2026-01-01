import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Derece AI - YKS Koçunuz",
  description: "Yapay zeka tabanlı kişisel YKS koçluk asistanı. Sana özel ders programı ve soru çözümleri.",
  keywords: ["YKS", "TYT", "AYT", "Koçluk", "Ders Programı", "Yapay Zeka", "Derece AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased fixed inset-0 overflow-hidden overscroll-none bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
