"use client";

import { SessionProvider } from "next-auth/react";
import { DataProvider } from "@/context/DataContext";
import Footer from "../components/Layout";

export default function RootLayoutClient({ children }) {
  return (
    <DataProvider>
      <SessionProvider>
        {children}
        <Footer />
      </SessionProvider>
    </DataProvider>
  );
}
