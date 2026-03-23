"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { initCapacitor } from "@/lib/capacitor";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initCapacitor();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
