"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, FileText, CheckCircle, XCircle, Clock, DoorOpen,
  Home, TrendingUp, ArrowRight, ChevronDown, Database, Sparkles, AlertTriangle
} from "lucide-react";
import { getDashboardStats, getAllPendaftaran, seedDefaultTataTertib } from "@/lib/firestore";
import {
  seedAsramaData, seedKegiatanDemo, seedLaporanDemo,
  type SeedProgress, type SeedResult,
} from "@/lib/seed";
import { useAuth } from "@/context/AuthContext";
import { TamuTerbaruWidget } from "@/components/features/TamuTerbaruWidget";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import type { DashboardStats, Pendaftaran } from "@/types";

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function AdminDashboard() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<SeedProgress | null>(null);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const { success, error } = useToast();

  const reload = async () => {
    const [s, p] = await Promise.all([
      getDashboardStats(),
      getAllPendaftaran(),
    ]);
    setStats(s);
    setRecent(p.slice(0, 5));
  };

  useEffect(() => {
    const load = async () => {
      await reload();
      setLoading(false);
    };
    load();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    setSeedProgress(null);
    try {
      // 1. Seed inti: kamar + akun mahasiswa + pendaftaran + penghuni
      const result = await seedAsramaData(FIREBASE_CONFIG, (p) => setSeedProgress(p));

      // 2. Seed konten dummy: tata tertib, kegiatan, laporan (best-effort, tidak menghentikan kalau salah satu gagal)
      let tataTertibCreated = 0;
      let kegiatanCreated = 0;
      let laporanCreated = 0;
      const adminUid = user?.uid;
      const adminNama = userProfile?.displayName ?? "Admin";

      try {
        setSeedProgress({ step: "Seed tata tertib default", current: 0, total: 1 });
        const tt = await seedDefaultTataTertib();
        tataTertibCreated = tt.created;
      } catch (err) {
        console.warn("Seed tata tertib gagal:", err);
      }

      if (adminUid) {
        try {
          setSeedProgress({ step: "Seed kegiatan demo", current: 0, total: 1 });
          const k = await seedKegiatanDemo(adminUid, adminNama);
          kegiatanCreated = k.created;
        } catch (err) {
          console.warn("Seed kegiatan gagal:", err);
        }

        try {
          setSeedProgress({ step: "Seed laporan demo", current: 0, total: 1 });
          const l = await seedLaporanDemo(adminUid, adminNama, undefined, adminUid, adminNama);
          laporanCreated = l.created;
        } catch (err) {
          console.warn("Seed laporan gagal:", err);
        }
      }

      const extended: SeedResult & {
        tataTertibCreated?: number;
        kegiatanCreated?: number;
        laporanCreated?: number;
      } = { ...result, tataTertibCreated, kegiatanCreated, laporanCreated };
      setSeedResult(extended);

      if (result.errors.length === 0) {
        success(
          `Seed selesai: ${result.mahasiswaDibuat} mahasiswa, ${result.kamarDibuat} kamar, ` +
          `${tataTertibCreated} tata tertib, ${kegiatanCreated} kegiatan, ${laporanCreated} laporan.`
        );
      } else {
        error(`Seed selesai dengan ${result.errors.length} error.`);
      }
      await reload();
    } catch (err) {
      console.error("Seed gagal:", err);
      error("Seed data gagal. Lihat console.");
    } finally {
      setSeeding(false);
      setSeedProgress(null);
    }
  };

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
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="md"
            className="rounded-2xl font-bold bg-white shadow-sm border-primary-200 text-primary-700 hover:bg-primary-50"
            icon={<Database className="w-5 h-5" />}
            onClick={() => setSeedOpen(true)}
          >
            Seed Data Demo
          </Button>
          <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-[13px] font-bold text-slate-600">
            <Clock className="w-4.5 h-4.5 text-primary-500" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          title="Total Pendaftar"
          value={stats?.totalPendaftar ?? 0}
          icon={<FileText />}
          color="bg-rose-600 text-white"
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

      {/* Tamu Terbaru */}
      <TamuTerbaruWidget href="/admin/tamu" />

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
                      <Home className="w-5 h-5 text-sky-400" />
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

      <Modal
        open={seedOpen}
        onClose={() => {
          if (seeding) return;
          setSeedOpen(false);
          setSeedResult(null);
        }}
        title="Seed Data Demo"
        size="md"
      >
        <div className="space-y-6">
          {!seedResult && (
            <>
              <div className="flex gap-4 p-5 rounded-2xl bg-primary-50 border border-primary-100">
                <Sparkles className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-bold text-primary-900 text-sm">Apa yang akan dibuat?</p>
                  <ul className="text-xs font-medium text-primary-800 leading-relaxed list-disc list-inside space-y-1">
                    <li>17 kamar (8 lantai 1, 9 lantai 2, kapasitas 4 per kamar)</li>
                    <li>16 akun mahasiswa (Auth + dokumen users)</li>
                    <li>16 dokumen pendaftaran berstatus diterima</li>
                    <li>16 dokumen penghuni — 4 orang per kamar, 13 kamar sisa kosong</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-bold text-amber-900 text-sm">Catatan</p>
                  <ul className="text-xs font-medium text-amber-800 leading-relaxed list-disc list-inside space-y-1">
                    <li>Kamar yang sudah ada (nomor sama) tidak akan diduplikasi.</li>
                    <li>Akun mahasiswa diberi password default <code className="bg-amber-100 px-1.5 py-0.5 rounded">asrama123</code></li>
                    <li>Email pola: <code className="bg-amber-100 px-1.5 py-0.5 rounded">nama.lengkap{`{n}`}@asramajambi.test</code></li>
                  </ul>
                </div>
              </div>

              {seedProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{seedProgress.step}</span>
                    <span>{seedProgress.current}/{seedProgress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${(seedProgress.current / Math.max(seedProgress.total, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl font-bold border-slate-200"
                  onClick={() => setSeedOpen(false)}
                  disabled={seeding}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 rounded-2xl font-bold bg-primary-600 hover:bg-primary-700 text-white"
                  icon={<Sparkles className="w-5 h-5" />}
                  onClick={handleSeed}
                  loading={seeding}
                  disabled={seeding}
                >
                  Mulai Seed
                </Button>
              </div>
            </>
          )}

          {seedResult && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Kamar Baru</p>
                  <p className="text-2xl font-black text-primary-900 mt-1">{seedResult.kamarDibuat}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Mahasiswa</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{seedResult.mahasiswaDibuat}</p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                  <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Pendaftaran</p>
                  <p className="text-2xl font-black text-sky-900 mt-1">{seedResult.pendaftaranDibuat}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Penghuni</p>
                  <p className="text-2xl font-black text-amber-900 mt-1">{seedResult.penghuniDibuat}</p>
                </div>
              </div>

              {seedResult.errors.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="font-bold text-rose-900 text-sm mb-2">
                    {seedResult.errors.length} error
                  </p>
                  <ul className="text-xs font-medium text-rose-700 leading-relaxed space-y-1 max-h-40 overflow-y-auto">
                    {seedResult.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                className="w-full rounded-2xl font-bold bg-primary-600 hover:bg-primary-700 text-white"
                onClick={() => {
                  setSeedOpen(false);
                  setSeedResult(null);
                }}
              >
                Tutup
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
