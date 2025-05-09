import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from '../components/Layout'
import {DataProvider} from '@/context/DataContext'
import { SessionProvider } from "next-auth/react";
import RootLayoutClient from "./layout-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GranCereal",
  description: "Sistema de gestión de inventario",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
