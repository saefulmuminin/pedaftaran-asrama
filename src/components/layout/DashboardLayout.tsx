"use client";

import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/context/AuthContext";
import { subscribeNotifikasi } from "@/lib/firestore";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Notifikasi } from "@/types";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to false for better mobile/initial UX
  
  useEffect(() => {
    // Open sidebar by default on desktop
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifikasi(user.uid, (notifs: Notifikasi[]) => {
      setUnreadCount(notifs.filter((n) => !n.dibaca).length);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={cn(
        "flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
        sidebarOpen ? "lg:ml-72" : "ml-0"
      )}>
        <Navbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          notifCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
