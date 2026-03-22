"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === tab.id
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-white"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-gray-500">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
