'use client';

import { AppProvider } from "@/context/AppContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
} 