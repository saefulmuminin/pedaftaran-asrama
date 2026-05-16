"use client";

import React, { useEffect, useState } from "react";
import { Bell, CheckCheck, Info, ShieldCheck, AlertCircle, Zap, MailOpen, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getNotifikasiByUser, markNotifikasiRead } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime, cn } from "@/lib/utils";
import type { Notifikasi } from "@/types";

const tipeStyle: Record<string, string> = {
  success: "bg-primary-50 border-primary-100 text-primary-700",
  error: "bg-red-50 border-red-100 text-red-700",
  warning: "bg-amber-50 border-amber-100 text-amber-700",
  info: "bg-blue-50 border-blue-100 text-blue-700",
};

const iconType: Record<string, any> = {
  success: ShieldCheck,
  error: AlertCircle,
  warning: Zap,
  info: Info,
};

export default function NotifikasiPage() {
  const { userProfile } = useAuth();
  const [notifs, setNotifs] = useState<Notifikasi[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!userProfile) return;
    const data = await getNotifikasiByUser(userProfile.uid);
    setNotifs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile]);

  const markAllRead = async () => {
    const unread = notifs.filter((n) => !n.dibaca);
    await Promise.all(unread.map((n) => markNotifikasiRead(n.id)));
    setNotifs((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  };

  const handleRead = async (id: string) => {
    await markNotifikasiRead(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)));
  };

  const unreadCount = notifs.filter((n) => !n.dibaca).length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Kotak Masuk</h1>
          <div className="flex items-center gap-3">
            <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", unreadCount > 0 ? "bg-primary-500 animate-pulse" : "bg-slate-300")} />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {unreadCount > 0 ? `${unreadCount} Pesan Baru Belum Terbaca` : "Semua Pemberitahuan Sudah Terbaca"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="lg" 
              icon={<CheckCheck className="w-5 h-5" />} 
              onClick={markAllRead}
              className="rounded-2xl font-bold border-slate-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 shadow-sm transition-all py-6"
            >
              Tandai Semua Terbaca
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Inbox Column */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/50 backdrop-blur-md rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sinkronisasi Pesan...</p>
            </div>
          ) : notifs.length === 0 ? (
            <Card className="p-24 text-center border-dashed border-4 bg-white/50 backdrop-blur-md rounded-[4rem] border-slate-100 shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
                <Bell className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kotak Masuk Kosong</h3>
              <p className="text-slate-500 font-medium mt-3 leading-relaxed max-w-md mx-auto">
                Anda belum memiliki pemberitahuan apapun saat ini. Pantau terus halaman ini untuk update pendaftaran.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {notifs.map((n) => {
                const Icon = iconType[n.tipe] || Info;
                return (
                  <Card
                    key={n.id}
                    onClick={() => !n.dibaca && handleRead(n.id)}
                    className={cn(
                      "p-8 rounded-[3rem] border-2 transition-all duration-700 cursor-pointer group relative overflow-hidden",
                      !n.dibaca 
                        ? cn("shadow-premium bg-white shadow-xl shadow-primary-500/5 ring-4 ring-primary-50/50", tipeStyle[n.tipe] || "border-primary-100") 
                        : "bg-white/50 backdrop-blur-md border-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-premium"
                    )}
                  >
                    {!n.dibaca && (
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                        <Icon className="w-32 h-32" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-8 relative z-10">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 shadow-premium group-hover:rotate-6",
                        !n.dibaca 
                          ? "bg-white text-current" 
                          : "bg-slate-50 text-slate-400 group-hover:bg-primary-600 group-hover:text-white"
                      )}>
                        <Icon className="w-8 h-8" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <h4 className={cn(
                            "text-lg font-black tracking-tight leading-tight transition-colors",
                            !n.dibaca ? "text-slate-900" : "text-slate-500 group-hover:text-primary-600"
                          )}>
                            {n.judul}
                          </h4>
                          {!n.dibaca && (
                            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 rounded-full shadow-lg shadow-primary-600/20 animate-in zoom-in duration-700">
                              <Zap className="w-3 h-3 text-white fill-white" />
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">Pesan Baru</span>
                            </div>
                          )}
                        </div>
                        
                        <p className={cn(
                          "text-sm font-medium leading-relaxed max-w-2xl",
                          !n.dibaca ? "text-slate-600" : "text-slate-400 group-hover:text-slate-600"
                        )}>
                          {n.pesan}
                        </p>
                        
                        <div className="flex items-center gap-3 pt-3">
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {formatDateTime(n.createdAt)}
                            </p>
                          </div>
                          {n.dibaca && (
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                              <MailOpen className="w-3 h-3" /> Sudah Dibaca
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <Card className="p-8 border-none bg-slate-900 text-white rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-20 h-20" />
            </div>
            <div className="relative z-10 space-y-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">Pusat Informasi</p>
              <h3 className="text-2xl font-black tracking-tight leading-tight">Keamanan & Privasi Pesan</h3>
              <p className="text-xs font-medium leading-relaxed opacity-60">
                Pesan ini bersifat pribadi dan hanya ditujukan kepada Anda sebagai pendaftar Asrama Jambi Jakarta. 
                Pastikan Anda memeriksa notifikasi secara rutin untuk update status pendaftaran.
              </p>
              <div className="pt-2">
                <Button variant="outline" className="w-full border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl py-6 text-xs">
                  Hubungi Support
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none bg-white shadow-premium rounded-[3rem] space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Kategori Pesan</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { color: "bg-blue-500", label: "Informasi Umum", desc: "Pembaruan rutin dan pengumuman asrama." },
                { color: "bg-emerald-500", label: "Status Pendaftaran", desc: "Kabar gembira mengenai penerimaan Anda." },
                { color: "bg-amber-500", label: "Peringatan", desc: "Informasi mendesak atau kekurangan dokumen." },
                { color: "bg-rose-500", label: "Penolakan", desc: "Informasi terkait ketidaksesuaian data pendaftaran." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={cn("w-1.5 h-auto rounded-full shrink-0 transition-all duration-500 group-hover:scale-y-125", item.color)} />
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">{item.label}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
