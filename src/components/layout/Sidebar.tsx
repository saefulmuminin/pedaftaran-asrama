"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  User,
  Users,
  DoorOpen,
  Bell,
  X,
  Home,
  CheckSquare,
  ScrollText,
  Wallet,
  UserCheck,
  Calendar,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";

const mahasiswaMenu = [
  { href: "/mahasiswa/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mahasiswa/pendaftaran", label: "Form Pendaftaran", icon: FileText },
  { href: "/mahasiswa/status", label: "Status Pendaftaran", icon: CheckSquare },
  { href: "/mahasiswa/kegiatan", label: "Kegiatan", icon: Calendar },
  { href: "/mahasiswa/tamu", label: "Buku Tamu", icon: UserCheck },
  { href: "/mahasiswa/tagihan", label: "Tagihan", icon: Wallet },
  { href: "/mahasiswa/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/tata-tertib", label: "Tata Tertib", icon: ScrollText },
  { href: "/mahasiswa/profil", label: "Profil Saya", icon: User },
];

const adminMenu = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pendaftar", label: "Data Pendaftar", icon: ClipboardList },
  { href: "/admin/penghuni", label: "Data Penghuni", icon: Users },
  { href: "/admin/kamar", label: "Manajemen Kamar", icon: DoorOpen },
  { href: "/admin/kegiatan", label: "Kegiatan", icon: Calendar },
  { href: "/admin/tamu", label: "Buku Tamu", icon: UserCheck },
  { href: "/admin/tagihan", label: "Tagihan", icon: Wallet },
  { href: "/admin/pengaturan-pembayaran", label: "Pengaturan Bayar", icon: CreditCard },
  { href: "/admin/notifikasi", label: "Kirim Notifikasi", icon: Bell },
  { href: "/admin/tata-tertib", label: "Kelola Tata Tertib", icon: ScrollText },
  { href: "/admin/profil", label: "Profil Admin", icon: User },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const menu = isAdmin ? adminMenu : mahasiswaMenu;

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 z-50 flex flex-col transition-transform duration-500 ease-out shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Asrama Jambi" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">Asrama Jambi</p>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Jakarta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">
            {isAdmin ? "Administrasi" : "Menu Utama"}
          </p>
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                  active
                    ? "bg-primary-600 text-white shadow-premium scale-[1.02]"
                    : "text-slate-500 hover:bg-primary-50 hover:text-primary-600 hover:translate-x-1"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform", active && "scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-slate-50">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xs font-bold text-slate-400 hover:text-primary-600 transition-all group"
          >
            <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            Kembali ke Beranda
          </Link>
        </div>
      </aside>
    </>
  );
}
