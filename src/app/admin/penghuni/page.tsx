"use client";

import React, { useEffect, useState } from "react";
import { Search, UserCheck, LogOut, Info, ShieldCheck, GraduationCap, MapPin } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { getAllPenghuni, updatePenghuni, updateKamar, getKamarById } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import type { Penghuni } from "@/types";

export default function PenghuniPage() {
  const { success, error } = useToast();
  const [penghuniList, setPenghuniList] = useState<Penghuni[]>([]);
  const [filtered, setFiltered] = useState<Penghuni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [checkoutModal, setCheckoutModal] = useState<Penghuni | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    const data = await getAllPenghuni();
    setPenghuniList(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(penghuniList); return; }
    const q = search.toLowerCase();
    setFiltered(penghuniList.filter(
      (p) => p.namaLengkap.toLowerCase().includes(q) || p.nim.toLowerCase().includes(q) || p.nomorKamar.includes(q)
    ));
  }, [search, penghuniList]);

  const handleCheckout = async () => {
    if (!checkoutModal) return;
    setActionLoading(true);
    try {
      await updatePenghuni(checkoutModal.id, {
        status: "keluar",
        tanggalKeluar: Timestamp.now(),
      });
      // Update kamar
      const kamar = await getKamarById(checkoutModal.kamarId);
      if (kamar) {
        await updateKamar(checkoutModal.kamarId, {
          terisi: Math.max(0, kamar.terisi - 1),
          penghuniIds: kamar.penghuniIds.filter((id) => id !== checkoutModal.userId),
          status: kamar.terisi - 1 < kamar.kapasitas ? "tersedia" : kamar.status,
        });
      }
      success("Penghuni berhasil dicheck-out.");
      setCheckoutModal(null);
      load();
    } catch {
      error("Gagal memproses check-out.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Penghuni Aktif</h1>
          <p className="text-slate-500 font-medium mt-1">Daftar mahasiswa yang saat ini menempati unit asrama.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-2xl border border-primary-100">
          <ShieldCheck className="w-4 h-4 text-primary-600" />
          <span className="text-xs font-black text-primary-700 uppercase tracking-widest">{filtered.length} Terverifikasi</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-2">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari nama penghuni, NIM, atau nomor kamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 rounded-[2rem] border-none bg-white shadow-premium text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-100/50 placeholder:text-slate-300 placeholder:font-medium transition-all"
          />
        </div>
      </div>

      <div className="px-2 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Data Penghuni...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-20 text-center border-dashed border-2 bg-transparent rounded-[3rem] border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Data Tidak Ditemukan</h3>
            <p className="text-slate-500 font-medium mt-2">
              {penghuniList.length === 0 ? "Belum ada penghuni aktif yang terdaftar." : "Coba gunakan kata kunci pencarian yang berbeda."}
            </p>
          </Card>
        ) : (
          <Card className="border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[3rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Mahasiswa</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institusi</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Kamar</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kontak</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tgl Masuk</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="group hover:bg-primary-50/30 transition-colors duration-300">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-white group-hover:text-primary-600 shadow-sm transition-all">
                            {p.namaLengkap.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 tracking-tight">{p.namaLengkap}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{p.nim}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-slate-300" />
                          <span className="font-bold text-slate-600">{p.universitas}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-500" />
                          <span className="px-3 py-1.5 bg-primary-100/50 text-primary-700 rounded-xl text-[10px] font-black tracking-widest">
                            {p.nomorKamar}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-600">{p.noHp}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-400">{formatDate(p.tanggalMasuk)}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Button
                          variant="ghost" 
                          size="sm"
                          icon={<LogOut className="w-4 h-4" />}
                          className="rounded-xl font-bold bg-white text-red-500 hover:bg-red-50 shadow-sm border border-slate-50 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                          onClick={() => setCheckoutModal(p)}
                        >
                          Check-out
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Checkout Modal */}
      <Modal open={!!checkoutModal} onClose={() => setCheckoutModal(null)} title="Check-out Penghuni">
        <div className="py-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <LogOut className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Konfirmasi Check-out</h3>
          <div className="mt-4 px-6 space-y-2">
            <p className="text-slate-500 font-medium leading-relaxed">
              Apakah Anda yakin ingin memproses check-out untuk <span className="font-black text-slate-900">{checkoutModal?.namaLengkap}</span>?
            </p>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-black text-slate-700 tracking-widest">UNIT KAMAR {checkoutModal?.nomorKamar}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-10 px-4">
            <Button variant="ghost" className="flex-1 font-bold rounded-xl" onClick={() => setCheckoutModal(null)}>Batalkan</Button>
            <Button variant="danger" loading={actionLoading} className="flex-1 font-bold rounded-xl shadow-md" onClick={handleCheckout}>Ya, Check-out</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
