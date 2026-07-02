"use client";

import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface DashboardShellProps {
  currentPath: string;
  children: React.ReactNode;
}

export function DashboardShell({ currentPath, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 h-14 px-4 bg-white border-b border-gray-200 safe-top">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 truncate">PatentPilot</span>
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          aria-label="메뉴 닫기"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        currentPath={currentPath}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
