"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Bell,
  User,
  BookOpen,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPendaftaranByUser, getNotifikasiByUser } from "@/lib/firestore";
import { JadwalSholatWidget } from "@/components/features/JadwalSholatWidget";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, getStatusLabel, cn } from "@/lib/utils";
import type { Pendaftaran, Notifikasi } from "@/types";

export default function MahasiswaDashboard() {
  const { userProfile } = userAuth();
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [notifs, setNotifs] = useState<Notifikasi[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  function userAuth() {
    return useAuth();
  }

  useEffect(() => {
    const load = async () => {
      if (!userProfile) return;
      const [p, n] = await Promise.all([
        getPendaftaranByUser(userProfile.uid),
        getNotifikasiByUser(userProfile.uid),
      ]);
      setPendaftaran(p);
      setNotifs(n.slice(0, 3));
      setLoadingData(false);
    };
    load();
  }, [userProfile]);

  const statusSteps = [
    { key: "submitted", label: "Dikirim", icon: FileText },
    { key: "diverifikasi", label: "Diverifikasi", icon: Clock },
    { key: "diterima", label: "Diterima", icon: CheckCircle },
  ];

  const currentStepIndex = pendaftaran
    ? statusSteps.findIndex((s) => s.key === pendaftaran.status)
    : -1;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      {/* Greeting */}
      <div className="relative overflow-hidden bg-primary-600 rounded-3xl p-8 md:p-10 text-white shadow-premium group">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
        <div className="relative z-10">
          <p className="text-primary-100 font-bold text-xs uppercase tracking-[0.2em]">Selamat datang kembali,</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">{userProfile?.displayName} 👋</h1>
          <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl w-fit border border-white/10">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            <p className="text-primary-50 text-xs font-bold uppercase tracking-wider">
              {pendaftaran
                ? `Status: ${getStatusLabel(pendaftaran.status)}`
                : "Belum ada pendaftaran aktif"}
            </p>
          </div>
        </div>
      </div>

      <JadwalSholatWidget />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { href: "/mahasiswa/pendaftaran", icon: FileText, label: "Form Pendaftaran", color: "bg-rose-50 text-rose-600" },
          { href: "/mahasiswa/status", icon: CheckCircle, label: "Status Pendaftaran", color: "bg-primary-50 text-primary-600" },
          { href: "/mahasiswa/notifikasi", icon: Bell, label: "Pusat Notifikasi", color: "bg-amber-50 text-amber-600" },
          { href: "/mahasiswa/profil", icon: User, label: "Profil Saya", color: "bg-sky-50 text-sky-600" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card hover className="p-6 flex flex-col items-center gap-4 text-center border-none shadow-premium bg-white/80 backdrop-blur-md group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${item.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary-600 transition-colors">{item.label}</span>
              </Card>
            </Link>
          );
        })}
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sinkronisasi Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Pendaftaran */}
          <div className="lg:col-span-2 space-y-8">
            {pendaftaran ? (
              <Card className="p-8 md:p-10 border-none shadow-premium bg-white/50 backdrop-blur-md overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/50 rounded-full blur-3xl -mr-10 -mt-10" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Status Pendaftaran</h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Update Terakhir: {formatDateTime(pendaftaran.updatedAt || pendaftaran.createdAt)}</p>
                    </div>
                    <Badge status={pendaftaran.status} />
                  </div>

                  {/* Progress steps */}
                  {pendaftaran.status !== "ditolak" && (
                    <div className="flex items-center gap-4 mb-12 relative px-4">
                      {statusSteps.map((step, i) => {
                        const Icon = step.icon;
                        const done = currentStepIndex >= i;
                        const active = currentStepIndex === i;
                        return (
                          <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center gap-3 flex-1 relative z-10">
                              <div
                                className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm", 
                                  done ? "bg-primary-600 text-white shadow-premium" : "bg-slate-50 text-slate-300",
                                  active && "ring-8 ring-primary-100"
                                )}
                              >
                                <Icon className={cn("w-6 h-6", active && "animate-pulse")} />
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest text-center ${done ? "text-primary-600" : "text-slate-400"}`}>
                                {step.label}
                              </span>
                            </div>
                            {i < statusSteps.length - 1 && (
                              <div className="flex-1 h-1.5 relative -mt-7">
                                <div className="absolute inset-0 bg-slate-100 rounded-full" />
                                <div 
                                  className={cn("absolute inset-y-0 left-0 bg-primary-600 rounded-full transition-all duration-1000", done ? "w-full" : "w-0")}
                                />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {pendaftaran.status === "ditolak" && (
                    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-8 animate-in shake duration-500">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                          <AlertCircle className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-rose-900 uppercase tracking-widest">Pendaftaran Ditolak</p>
                          <p className="text-sm text-rose-600/80 mt-1 font-medium leading-relaxed">{pendaftaran.catatanAdmin ?? "Silakan lengkapi kembali berkas Anda atau hubungi admin."}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {pendaftaran.status === "diterima" && pendaftaran.nomorKamar && (
                    <div className="bg-primary-600 text-white rounded-3xl p-8 mb-8 shadow-premium relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <p className="text-primary-100 font-bold text-xs uppercase tracking-[0.2em] mb-2">Selamat! Anda Berhasil Diterima</p>
                          <h3 className="text-2xl font-black tracking-tight leading-tight">Silakan melakukan konfirmasi & check-in</h3>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center min-w-[120px] border border-white/10 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Nomor Kamar</p>
                          <p className="text-3xl font-black">{pendaftaran.nomorKamar}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    {[
                      { label: "Nama Lengkap", value: pendaftaran.namaLengkap, icon: User },
                      { label: "Nomor Induk (NIM)", value: pendaftaran.nim, icon: BookOpen },
                      { label: "Institusi Kampus", value: pendaftaran.universitas, icon: Building2 },
                      { label: "Waktu Pengajuan", value: formatDateTime(pendaftaran.submittedAt), icon: Clock },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.label}</p>
                          <p className="font-bold text-slate-800 leading-tight">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Link href="/mahasiswa/status">
                      <Button variant="outline" className="w-full py-6 rounded-2xl font-bold group">
                        Lihat Rincian Lengkap <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center border-none shadow-premium bg-white/50 backdrop-blur-md">
                <div className="w-24 h-24 bg-primary-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce duration-3000">
                  <BookOpen className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Belum Ada Pendaftaran</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                  Kamu belum mengajukan permohonan hunian asrama. Lengkapi formulir pendaftaran untuk memulai proses seleksi.
                </p>
                <Link href="/mahasiswa/pendaftaran">
                  <Button className="px-10 py-6 text-lg rounded-2xl shadow-premium hover:scale-105 active:scale-95 transition-all">
                    Mulai Daftar Sekarang <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Notifikasi terbaru */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Notifikasi</h2>
              <Link href="/mahasiswa/notifikasi" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
                Lihat Semua
              </Link>
            </div>
            
            {notifs.length > 0 ? (
              <div className="space-y-4">
                {notifs.map((n) => (
                  <Card key={n.id} className={cn(
                    "p-5 border-none shadow-sm transition-all hover:shadow-premium group relative overflow-hidden",
                    n.dibaca ? "bg-white" : "bg-primary-50/50 border-l-4 border-l-primary-600"
                  )}>
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        n.dibaca ? "bg-slate-50 text-slate-400" : "bg-primary-100 text-primary-600"
                      )}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-primary-600 transition-colors">{n.judul}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.pesan}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-10 text-center border-none shadow-premium bg-white/50 backdrop-blur-md">
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Belum Ada Notifikasi</p>
              </Card>
            )}

            {/* Help Card */}
            <Card className="p-6 bg-slate-900 text-white border-none shadow-premium relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-600 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2" />
              <p className="text-primary-400 font-black text-[10px] uppercase tracking-widest mb-4">Butuh Bantuan?</p>
              <h4 className="text-lg font-extrabold tracking-tight mb-2">Pusat Informasi</h4>
              <p className="text-slate-400 text-xs font-medium mb-6 leading-relaxed">Hubungi pengelola asrama jika Anda menemui kendala dalam sistem pendaftaran.</p>
              <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl py-5">
                Hubungi Admin
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
