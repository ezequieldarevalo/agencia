"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { GlobalSearch } from "@/components/global-search";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-16 flex flex-col">
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
