"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { GlobalSearch } from "@/components/global-search";
import { PlanProvider } from "@/components/plan-provider";
import { PlanGate } from "@/components/plan-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PlanProvider>
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-16 flex flex-col min-w-0">
          <TopBar
            onOpenSearch={() => setSearchOpen(true)}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <PlanGate>{children}</PlanGate>
          </main>
        </div>
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </PlanProvider>
  );
}
