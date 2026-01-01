"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
