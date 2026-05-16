"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onMenuClick?: () => void;
  notifCount?: number;
}

export function Navbar({ onMenuClick, notifCount = 0 }: NavbarProps) {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-20 glass border-b border-slate-100 flex items-center px-6 md:px-8 gap-4 sticky top-0 z-40">
      {/* Menu button hidden on mobile (uses BottomNav), visible on md+ for desktop/tablet toggle */}
      <button
        onClick={onMenuClick}
        className="p-2.5 rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 hidden md:flex items-center justify-center transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notifikasi */}
        <Link
          href={userProfile?.role === "admin" ? "/admin/notifikasi" : "/mahasiswa/notifikasi"}
          className="relative p-2.5 rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-all"
        >
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
              <User className="w-5 h-5 text-primary-700" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {userProfile?.displayName ?? "User"}
              </p>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">{userProfile?.role}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", dropdownOpen && "rotate-180")} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-14 w-60 bg-white rounded-3xl shadow-premium border border-slate-50 z-20 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">
                    {userProfile?.displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate font-medium">{userProfile?.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    href={userProfile?.role === "admin" ? "/admin/profil" : "/mahasiswa/profil"}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 rounded-2xl hover:bg-primary-50 hover:text-primary-700 transition-all"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profil Saya
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-600 rounded-2xl hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
