"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, FileText, CheckCircle, XCircle, Clock, DoorOpen,
  Home, TrendingUp, ArrowRight, ChevronDown
} from "lucide-react";
import { getDashboardStats, getAllPendaftaran } from "@/lib/firestore";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import type { DashboardStats, Pendaftaran } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, p] = await Promise.all([
        getDashboardStats(),
        getAllPendaftaran(),
      ]);
      setStats(s);
      setRecent(p.slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-700">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-slate-500 font-medium">Selamat datang kembali, Anita. Berikut adalah ringkasan data hunian.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-[13px] font-bold text-slate-600">
          <Clock className="w-4.5 h-4.5 text-primary-500" />
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          title="Total Pendaftar"
          value={stats?.totalPendaftar ?? 0}
          icon={<FileText />}
          color="bg-indigo-600 text-white"
          description="Peningkatan 12% dari bulan lalu"
          className="shadow-xl"
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={stats?.submitted ?? 0}
          icon={<Clock />}
          color="bg-amber-500 text-white"
          description="Perlu segera diproses"
          className="shadow-xl"
        />
        <StatCard
          title="Pendaftar Diterima"
          value={stats?.diterima ?? 0}
          icon={<CheckCircle />}
          color="bg-primary-600 text-white"
          description="Kapasitas hampir penuh"
          className="shadow-xl"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Monthly Occupancy Chart */}
        <Card className="xl:col-span-2 p-8 border-none shadow-premium bg-white group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Okupansi Bulanan</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Laporan Tahun 2024</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500">
              Statistik Tahunan <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          
          <div className="relative h-[300px] w-full flex items-end justify-between gap-2 px-2">
            {[25, 45, 35, 60, 50, 40, 75, 65].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                <div className="relative w-full flex flex-col justify-end h-[240px]">
                  <div 
                    className="w-full bg-primary-100 rounded-t-xl group-hover/bar:bg-primary-600 transition-all duration-500 cursor-pointer relative"
                    style={{ height: `${val}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {val}% Rate
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'][i]}
                </span>
              </div>
            ))}
            <svg className="absolute top-0 left-0 w-full h-[240px] pointer-events-none opacity-20" preserveAspectRatio="none">
              <path d="M0 180 Q 50 120, 100 150 T 200 80 T 300 120 T 400 50 T 500 90 T 600 30" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary-600" />
            </svg>
          </div>
        </Card>

        {/* Status Payment */}
        <Card className="p-8 border-none shadow-premium bg-white">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Status Pembayaran</h2>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-end gap-3 h-40">
              <div className="flex-1 bg-primary-50 rounded-t-xl h-[60%]"></div>
              <div className="flex-1 bg-primary-100 rounded-t-xl h-[80%]"></div>
              <div className="flex-1 bg-primary-200 rounded-t-xl h-[40%]"></div>
              <div className="flex-1 bg-primary-600 rounded-t-xl h-full"></div>
              <div className="flex-1 bg-primary-300 rounded-t-xl h-[70%]"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Pending</p>
                <p className="text-xl font-black text-rose-900">{stats?.submitted ?? 0}</p>
              </div>
              <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Paid</p>
                <p className="text-xl font-black text-primary-900">{stats?.diterima ?? 0}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card className="overflow-hidden border-none shadow-premium bg-white">
            <div className="p-8 flex items-center justify-between border-b border-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Daftar Penghuni Baru</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Aktivitas Terakhir</p>
              </div>
              <Link href="/admin/pendaftar">
                <Button variant="ghost" className="rounded-xl font-bold text-primary-600 hover:bg-primary-50">
                  Lihat Semua <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="py-20 text-center">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">Belum ada aktivitas terbaru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/20">
                      <th className="px-8 py-4">Mahasiswa</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recent.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">
                              {p.namaLengkap.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{p.namaLengkap}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.universitas}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <Badge status={p.status} />
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Link href={`/admin/pendaftar/${p.id}`}>
                            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all">
                              <ArrowRight className="w-4.5 h-4.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 border-none shadow-premium bg-slate-900 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-6">Informasi Hunian</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-400" />
                    </div>
                    <span className="text-sm font-bold">Total Penghuni</span>
                  </div>
                  <span className="text-xl font-black">{stats?.totalPenghuni ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Home className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-sm font-bold">Kamar Tersedia</span>
                  </div>
                  <span className="text-xl font-black">{stats?.kamarTersedia ?? 0}</span>
                </div>
              </div>
              <Link href="/admin/kamar">
                <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border border-white/10">
                  Detail Kamar
                </button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-white">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Aktivitas Terbaru</h3>
            <div className="space-y-6">
              {[
                { user: "Budi bayar", time: "25 mnt yang lalu", action: "Pembayaran" },
                { user: "Citra daftar", time: "2 jam yang lalu", action: "Pendaftaran" },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">
                    {act.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{act.user}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{act.time} • {act.action}</p>
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
