"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  DoorOpen,
  Bell,
  User,
  CheckSquare,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";

const mahasiswaMenu = [
  { href: "/mahasiswa/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/mahasiswa/status", label: "Status", icon: CheckSquare },
  { href: "/mahasiswa/tagihan", label: "Tagihan", icon: Wallet },
  { href: "/mahasiswa/notifikasi", label: "Notif", icon: Bell },
  { href: "/mahasiswa/profil", label: "Profil", icon: User },
];

const adminMenu = [
  { href: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/admin/pendaftar", label: "Pendaftar", icon: ClipboardList },
  { href: "/admin/penghuni", label: "Penghuni", icon: Users },
  { href: "/admin/kamar", label: "Kamar", icon: DoorOpen },
  { href: "/admin/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const menu = isAdmin ? adminMenu : mahasiswaMenu;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 py-3 z-[100] md:hidden shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-300 relative",
                active ? "text-primary-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {active && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-600 rounded-full" />
              )}
              <Icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
