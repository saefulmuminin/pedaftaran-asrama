"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  DoorOpen,
  Users,
  Calendar,
  Phone,
  Settings,
  ShieldCheck,
  Info,
} from "lucide-react";
import { getKamarById, getAllPenghuni } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn, formatDate } from "@/lib/utils";
import type { Kamar, Penghuni } from "@/types";

export default function KamarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { error } = useToast();

  const [kamar, setKamar] = useState<Kamar | null>(null);
  const [penghuniList, setPenghuniList] = useState<Penghuni[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [k, p] = await Promise.all([getKamarById(id), getAllPenghuni()]);
        if (!k) {
          error("Kamar tidak ditemukan.");
          router.push("/admin/kamar");
          return;
        }
        setKamar(k);
        // Filter penghuni untuk kamar ini saja
        const kPenghuni = p.filter((x) => x.kamarId === k.id || x.nomorKamar === k.nomorKamar);
        setPenghuniList(kPenghuni);
      } catch (err) {
        console.error("Gagal memuat detail kamar:", err);
        error("Gagal memuat detail kamar.");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, router, error]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Detail Kamar...</p>
      </div>
    );
  }

  if (!kamar) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      {/* Header Section */}
      <div className="flex items-center gap-4 px-2">
        <button
          onClick={() => router.push("/admin/kamar")}
          className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-primary-600 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kamar {kamar.nomorKamar}</h1>
          <p className="text-slate-500 font-medium mt-1">Detail informasi kamar dan daftar penghuni aktif.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        
        {/* Left Column: Room Overview & Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                  <DoorOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-800 text-lg leading-tight">Overview Kamar</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Spesifikasi & Status</p>
                </div>
              </div>
              <Badge kamarStatus={kamar.status} className="scale-110" />
            </div>

            {/* Specification Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Posisi Lantai</span>
                <span className="text-base font-black text-slate-800 mt-1 block">Lantai {kamar.lantai}</span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kategori</span>
                <span className="text-base font-black text-slate-855 mt-1 block">
                  {kamar.jenisKelamin === "L" ? "Putra" : "Putri"}
                </span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl col-span-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kapasitas Hunian</span>
                <span className="text-base font-black text-slate-800 mt-1 block">
                  {kamar.terisi} / {kamar.kapasitas} Tempat Tidur
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-tight">
                <span>Rasio Keterisian</span>
                <span>{Math.round((kamar.terisi / kamar.kapasitas) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    kamar.terisi >= kamar.kapasitas ? "bg-red-500" : kamar.terisi > kamar.kapasitas / 2 ? "bg-amber-500" : "bg-primary-500"
                  )}
                  style={{ width: `${Math.min((kamar.terisi / kamar.kapasitas) * 100, 100)}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Room Facilities */}
          <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem] space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Fasilitas Kamar</h3>
            <div className="flex flex-wrap gap-2">
              {kamar.fasilitas.length > 0 ? (
                kamar.fasilitas.map((f) => (
                  <span key={f} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-tight border border-slate-100 shadow-sm">
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-xs font-bold text-slate-300 italic">Belum ada fasilitas</span>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Residents List */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8 md:p-10 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 text-lg leading-tight">Daftar Penghuni</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Mahasiswa yang terdaftar di Kamar {kamar.nomorKamar}
                </p>
              </div>
            </div>

            {penghuniList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {penghuniList.map((p) => (
                  <div
                    key={p.id}
                    className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 space-y-4 relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-sm group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        {p.namaLengkap.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm tracking-tight">{p.namaLengkap}</h4>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{p.nim}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-50 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold">Universitas:</span>
                        <span className="font-extrabold text-slate-800">{p.universitas}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold">No HP:</span>
                        <span className="font-extrabold text-slate-800 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.noHp}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold">Tanggal Masuk:</span>
                        <span className="font-extrabold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(p.tanggalMasuk)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-4xl bg-slate-50/20">
                <DoorOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-extrabold text-slate-800">Kamar Kosong</h3>
                <p className="text-slate-400 font-medium mt-1 text-sm">Tidak ada mahasiswa yang menempati kamar ini.</p>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
