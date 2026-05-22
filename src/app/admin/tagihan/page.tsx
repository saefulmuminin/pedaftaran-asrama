"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Wallet, Plus, CheckCircle, Clock, XCircle, Filter, RefreshCw,
  AlertTriangle, UserPlus, Trash2,
} from "lucide-react";
import {
  getAllTagihan,
  generateTagihanBulkPeriode,
  createTagihanCustom,
  deleteTagihan,
  getCurrentPeriode,
  formatPeriode,
  TAGIHAN_BULANAN,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Tagihan, StatusTagihan, Penghuni } from "@/types";

const STATUS_LABEL: Record<StatusTagihan, { label: string; color: string }> = {
  unpaid: { label: "Belum Bayar", color: "bg-amber-50 text-amber-700 border-amber-200" },
  pending: { label: "Pending", color: "bg-sky-50 text-sky-700 border-sky-200" },
  lunas: { label: "Lunas", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Dibatalkan", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

/** Periode opts: 6 bulan lalu + bulan sekarang + 6 bulan ke depan */
function buildPeriodeOptions(): string[] {
  const opts: string[] = [];
  const now = new Date();
  for (let i = -6; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return opts.reverse(); // future first
}

export default function AdminTagihanPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [data, setData] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState(getCurrentPeriode());
  const [statusFilter, setStatusFilter] = useState<"semua" | StatusTagihan>("semua");

  // Generate bulk modal
  const [genOpen, setGenOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({
    periode: getCurrentPeriode(),
    judul: "Iuran Bulanan",
    jumlah: TAGIHAN_BULANAN,
    catatan: "",
  });

  // Custom per-penghuni modal
  const [customOpen, setCustomOpen] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const [penghuniList, setPenghuniList] = useState<Penghuni[]>([]);
  const [customForm, setCustomForm] = useState({
    penghuniId: "",
    periode: getCurrentPeriode(),
    judul: "",
    jumlah: 0,
    catatan: "",
  });

  const periodeOptions = buildPeriodeOptions();

  const load = useCallback(async () => {
    setLoading(true);
    const list = await getAllTagihan(periode);
    setData(list);
    setLoading(false);
  }, [periode]);

  useEffect(() => { load(); }, [load]);

  const filtered = statusFilter === "semua" ? data : data.filter((t) => t.status === statusFilter);

  const totalLunas = data.filter((t) => t.status === "lunas").reduce((s, t) => s + t.jumlah, 0);
  const totalUnpaid = data.filter((t) => t.status === "unpaid" || t.status === "pending").reduce((s, t) => s + t.jumlah, 0);

  const openGenerate = () => {
    setGenForm({
      periode,
      judul: "Iuran Bulanan",
      jumlah: TAGIHAN_BULANAN,
      catatan: "",
    });
    setGenOpen(true);
  };

  const handleGenerate = async () => {
    if (!user?.uid) return;
    if (!genForm.judul.trim()) { error("Judul tagihan wajib diisi."); return; }
    if (genForm.jumlah <= 0) { error("Nominal harus lebih dari 0."); return; }
    setGenerating(true);
    try {
      const result = await generateTagihanBulkPeriode(genForm.periode, user.uid, {
        judul: genForm.judul,
        jumlah: genForm.jumlah,
        catatan: genForm.catatan || undefined,
      });
      success(`${result.created} tagihan dibuat, ${result.skipped} sudah ada (skip).`);
      setGenOpen(false);
      // Auto-switch periode view to generated periode
      setPeriode(genForm.periode);
    } catch (err) {
      console.error("Generate tagihan gagal:", err);
      error("Gagal generate tagihan.");
    } finally {
      setGenerating(false);
    }
  };

  const openCustom = async () => {
    setCustomForm({
      penghuniId: "",
      periode: getCurrentPeriode(),
      judul: "",
      jumlah: 0,
      catatan: "",
    });
    // Load penghuni aktif
    const snap = await getDocs(query(collection(db, "penghuni"), where("status", "==", "aktif")));
    setPenghuniList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Penghuni))
      .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap)));
    setCustomOpen(true);
  };

  const handleCustom = async () => {
    if (!user?.uid) return;
    if (!customForm.penghuniId) { error("Pilih penghuni dulu."); return; }
    if (!customForm.judul.trim()) { error("Judul tagihan wajib diisi."); return; }
    if (customForm.jumlah <= 0) { error("Nominal harus lebih dari 0."); return; }

    const penghuni = penghuniList.find((p) => p.id === customForm.penghuniId);
    if (!penghuni) return;

    setSavingCustom(true);
    try {
      await createTagihanCustom(penghuni, {
        judul: customForm.judul.trim(),
        jumlah: customForm.jumlah,
        periode: customForm.periode,
        catatan: customForm.catatan.trim() || undefined,
      }, user.uid);
      success("Tagihan custom berhasil dibuat.");
      setCustomOpen(false);
      setPeriode(customForm.periode);
    } catch (err) {
      console.error(err);
      error("Gagal membuat tagihan.");
    } finally {
      setSavingCustom(false);
    }
  };

  const handleDelete = async (t: Tagihan) => {
    if (t.status === "lunas") {
      error("Tagihan lunas tidak boleh dihapus.");
      return;
    }
    if (!confirm(`Hapus tagihan "${t.judul}" untuk ${t.namaLengkap}?`)) return;
    try {
      await deleteTagihan(t.id);
      success("Tagihan dihapus.");
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menghapus.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tagihan</h1>
          <p className="text-slate-500 font-medium mt-1">
            Periode aktif: <span className="font-bold text-primary-600">{formatPeriode(periode)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="md"
            className="rounded-2xl font-bold bg-white shadow-sm border-slate-200"
            icon={<RefreshCw className="w-5 h-5" />}
            onClick={load}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="md"
            className="rounded-2xl font-bold bg-white shadow-sm border-slate-200"
            icon={<UserPlus className="w-5 h-5" />}
            onClick={openCustom}
          >
            Tagihan Custom
          </Button>
          <Button
            size="md"
            className="rounded-2xl font-bold"
            icon={<Plus className="w-5 h-5" />}
            onClick={openGenerate}
          >
            Generate Bulk
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Tagihan</p>
          <p className="text-3xl font-black text-slate-900">{data.length}</p>
        </Card>
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-emerald-50">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Lunas</p>
          <p className="text-3xl font-black text-emerald-700">
            {data.filter((t) => t.status === "lunas").length}
          </p>
        </Card>
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-amber-50">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Belum/Pending</p>
          <p className="text-3xl font-black text-amber-700">
            {data.filter((t) => t.status === "unpaid" || t.status === "pending").length}
          </p>
        </Card>
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-primary-50">
          <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Total Terkumpul</p>
          <p className="text-xl font-black text-primary-700">
            Rp {totalLunas.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-primary-600/70 mt-1">
            sisa: Rp {totalUnpaid.toLocaleString("id-ID")}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 bg-white/80 backdrop-blur-md border-none shadow-sm rounded-[2rem]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl flex-1">
            <Wallet className="w-4 h-4 text-primary-600" />
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
            >
              {periodeOptions.map((p) => {
                const isCurrent = p === getCurrentPeriode();
                const isFuture = p > getCurrentPeriode();
                return (
                  <option key={p} value={p}>
                    {formatPeriode(p)}
                    {isCurrent ? " · Bulan Ini" : isFuture ? " · Mendatang" : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl">
            <Filter className="w-4 h-4 text-primary-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none min-w-[160px]"
            >
              <option value="semua">Semua Status</option>
              <option value="unpaid">Belum Bayar</option>
              <option value="pending">Pending</option>
              <option value="lunas">Lunas</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-none shadow-premium bg-white/50 backdrop-blur-md rounded-[2.5rem]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Tagihan...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 px-8">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Belum Ada Tagihan</h3>
            <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
              Klik &ldquo;Generate Bulk&rdquo; untuk membuat tagihan massal, atau
              &ldquo;Tagihan Custom&rdquo; untuk satu penghuni.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5">Penghuni</th>
                  <th className="px-6 py-5">Judul</th>
                  <th className="px-6 py-5">Kamar</th>
                  <th className="px-6 py-5 text-right">Jumlah</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5">Dibayar</th>
                  <th className="px-6 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const meta = STATUS_LABEL[t.status];
                  return (
                    <tr key={t.id} className="hover:bg-primary-50/20 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center font-black text-primary-700 shadow-sm text-sm shrink-0">
                            {t.namaLengkap.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{t.namaLengkap}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800">{t.judul ?? "Iuran Bulanan"}</p>
                        {t.catatan && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{t.catatan}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-slate-600 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                          {t.nomorKamar}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-extrabold text-slate-900">
                        Rp {t.jumlah.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
                          {t.status === "lunas" ? <CheckCircle className="w-3 h-3" /> :
                            t.status === "pending" ? <Clock className="w-3 h-3" /> :
                            t.status === "unpaid" ? <AlertTriangle className="w-3 h-3" /> :
                            <XCircle className="w-3 h-3" />}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-500 font-medium">
                        {t.paidAt ? new Date(t.paidAt.seconds * 1000).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                        }) : "—"}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {t.status !== "lunas" && (
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Generate Bulk Modal */}
      <Modal
        open={genOpen}
        onClose={() => !generating && setGenOpen(false)}
        title="Generate Tagihan Bulk"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Akan dibuat tagihan untuk <span className="font-bold">semua penghuni aktif</span> pada periode terpilih.
            Penghuni yang sudah punya tagihan <span className="font-bold">judul yang sama</span> di periode tsb akan di-skip.
          </p>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Periode <span className="text-red-500">*</span>
            </label>
            <select
              value={genForm.periode}
              onChange={(e) => setGenForm({ ...genForm, periode: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-primary-400"
            >
              {periodeOptions.map((p) => (
                <option key={p} value={p}>{formatPeriode(p)}</option>
              ))}
            </select>
            {genForm.periode > getCurrentPeriode() && (
              <p className="text-xs text-amber-600 font-bold mt-1.5">
                ⚠ Periode ini belum aktif — tagihan tidak akan muncul di mahasiswa sampai bulan tersebut tiba.
              </p>
            )}
          </div>

          <Input
            label="Judul Tagihan"
            placeholder="Iuran Bulanan / Iuran Renovasi / dll"
            value={genForm.judul}
            onChange={(e) => setGenForm({ ...genForm, judul: e.target.value })}
            required
          />

          <Input
            label="Nominal (Rp)"
            type="number"
            min={1}
            value={genForm.jumlah}
            onChange={(e) => setGenForm({ ...genForm, jumlah: parseInt(e.target.value, 10) || 0 })}
            required
          />

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Catatan (opsional)
            </label>
            <textarea
              rows={2}
              value={genForm.catatan}
              onChange={(e) => setGenForm({ ...genForm, catatan: e.target.value })}
              placeholder="Catatan tambahan untuk semua tagihan ini..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl font-bold border-slate-200"
              onClick={() => setGenOpen(false)}
              disabled={generating}
            >
              Batal
            </Button>
            <Button
              className="flex-1 rounded-2xl font-bold"
              onClick={handleGenerate}
              loading={generating}
            >
              Generate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Custom Per-Penghuni Modal */}
      <Modal
        open={customOpen}
        onClose={() => !savingCustom && setCustomOpen(false)}
        title="Buat Tagihan Custom"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Buat tagihan untuk <span className="font-bold">satu penghuni</span> dengan judul & nominal custom — cocok untuk denda, iuran khusus, dll.
          </p>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Penghuni <span className="text-red-500">*</span>
            </label>
            <select
              value={customForm.penghuniId}
              onChange={(e) => setCustomForm({ ...customForm, penghuniId: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-primary-400"
            >
              <option value="">— Pilih Penghuni —</option>
              {penghuniList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaLengkap} (Kamar {p.nomorKamar})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Periode <span className="text-red-500">*</span>
            </label>
            <select
              value={customForm.periode}
              onChange={(e) => setCustomForm({ ...customForm, periode: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-primary-400"
            >
              {periodeOptions.map((p) => (
                <option key={p} value={p}>{formatPeriode(p)}</option>
              ))}
            </select>
          </div>

          <Input
            label="Judul Tagihan"
            placeholder="Mis. Denda Keterlambatan Bayar"
            value={customForm.judul}
            onChange={(e) => setCustomForm({ ...customForm, judul: e.target.value })}
            required
          />

          <Input
            label="Nominal (Rp)"
            type="number"
            min={1}
            value={customForm.jumlah || ""}
            onChange={(e) => setCustomForm({ ...customForm, jumlah: parseInt(e.target.value, 10) || 0 })}
            required
          />

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Catatan (opsional)
            </label>
            <textarea
              rows={2}
              value={customForm.catatan}
              onChange={(e) => setCustomForm({ ...customForm, catatan: e.target.value })}
              placeholder="Catatan untuk penghuni..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl font-bold border-slate-200"
              onClick={() => setCustomOpen(false)}
              disabled={savingCustom}
            >
              Batal
            </Button>
            <Button
              className="flex-1 rounded-2xl font-bold"
              onClick={handleCustom}
              loading={savingCustom}
            >
              Buat Tagihan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
