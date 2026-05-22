"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  Plus, Calendar, MapPin, Megaphone, Users, ClipboardList, Trash2,
  Loader2, CheckCircle, Pin, Filter,
} from "lucide-react";
import { createKegiatan, getAllKegiatan, deleteKegiatan, updateKegiatan } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Kegiatan, KategoriKegiatan } from "@/types";

const KATEGORI_META: Record<KategoriKegiatan, { label: string; color: string; Icon: React.ElementType }> = {
  komunitas: { label: "Komunitas", color: "bg-sky-50 text-sky-700 border-sky-200", Icon: Users },
  wajib: { label: "Wajib", color: "bg-rose-50 text-rose-700 border-rose-200", Icon: Megaphone },
  laporan: { label: "Laporan", color: "bg-amber-50 text-amber-700 border-amber-200", Icon: ClipboardList },
};

export function KegiatanPage() {
  const { user, userProfile } = useAuth();
  const { success, error } = useToast();
  const [data, setData] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | KategoriKegiatan>("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = userProfile?.role === "admin";

  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    kategori: "komunitas" as KategoriKegiatan,
    tanggalMulai: new Date().toISOString().slice(0, 16),
    tanggalSelesai: "",
    lokasi: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getAllKegiatan());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "semua" ? data : data.filter((k) => k.kategori === filter);

  const resetForm = () => setForm({
    judul: "",
    deskripsi: "",
    kategori: isAdmin ? "wajib" : "komunitas",
    tanggalMulai: new Date().toISOString().slice(0, 16),
    tanggalSelesai: "",
    lokasi: "",
  });

  const openForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !userProfile) return;
    if (!form.judul.trim() || !form.deskripsi.trim()) {
      error("Judul dan deskripsi wajib diisi.");
      return;
    }
    // Mahasiswa tidak boleh post kategori "wajib"
    if (!isAdmin && form.kategori === "wajib") {
      error("Hanya admin yang bisa membuat kegiatan wajib.");
      return;
    }
    setSaving(true);
    try {
      const now = Timestamp.now();
      await createKegiatan({
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        kategori: form.kategori,
        dibuatOlehUid: user.uid,
        dibuatOlehNama: userProfile.displayName,
        dibuatOlehRole: userProfile.role,
        tanggalMulai: Timestamp.fromDate(new Date(form.tanggalMulai)),
        tanggalSelesai: form.tanggalSelesai
          ? Timestamp.fromDate(new Date(form.tanggalSelesai))
          : undefined,
        lokasi: form.lokasi.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
      success("Kegiatan berhasil dibuat.");
      setFormOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menyimpan kegiatan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (k: Kegiatan) => {
    if (!isAdmin && k.dibuatOlehUid !== user?.uid) {
      error("Anda hanya bisa menghapus kegiatan sendiri.");
      return;
    }
    if (!confirm(`Hapus kegiatan "${k.judul}"?`)) return;
    try {
      await deleteKegiatan(k.id);
      success("Kegiatan dihapus.");
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menghapus.");
    }
  };

  const handleTanggapiLaporan = async (k: Kegiatan) => {
    const catatan = prompt(`Tanggapi laporan "${k.judul}":`, k.catatanAdmin ?? "");
    if (catatan === null) return;
    try {
      await updateKegiatan(k.id, {
        ditanggapiAdmin: true,
        catatanAdmin: catatan.trim(),
      });
      success("Tanggapan tersimpan.");
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menyimpan tanggapan.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kegiatan Asrama</h1>
          <p className="text-slate-500 font-medium mt-1">
            {isAdmin
              ? "Buat kegiatan wajib (kerja bakti, rapat) atau tanggapi laporan mahasiswa."
              : "Buat kegiatan komunitas atau laporkan kegiatan asrama ke pengurus."}
          </p>
        </div>
        <Button
          size="md"
          className="rounded-2xl font-bold"
          icon={<Plus className="w-5 h-5" />}
          onClick={openForm}
        >
          Buat Kegiatan
        </Button>
      </div>

      {/* Filter */}
      <Card className="p-3 bg-white/80 backdrop-blur-md border-none shadow-sm rounded-[2rem]">
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl">
          <Filter className="w-4 h-4 text-primary-600 shrink-0" />
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter("semua")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                filter === "semua" ? "bg-primary-600 text-white shadow-sm" : "text-slate-500 hover:bg-white"
              }`}
            >
              Semua
            </button>
            {(Object.keys(KATEGORI_META) as KategoriKegiatan[]).map((k) => {
              const meta = KATEGORI_META[k];
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                    filter === k ? "bg-primary-600 text-white shadow-sm" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 border-none shadow-sm rounded-[2.5rem] text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Belum Ada Kegiatan</h3>
          <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
            Mulai buat kegiatan baru dengan tombol di atas.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((k) => {
            const meta = KATEGORI_META[k.kategori];
            const Icon = meta.Icon;
            const canDelete = isAdmin || k.dibuatOlehUid === user?.uid;
            const showAdminTanggap = isAdmin && k.kategori === "laporan";
            return (
              <Card key={k.id} className="p-5 md:p-6 border-none shadow-sm rounded-[2rem] bg-white">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.color.split(" ")[0]} ${meta.color.split(" ")[1]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900">{k.judul}</h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
                            {meta.label}
                          </span>
                          {k.kategori === "wajib" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                              <Pin className="w-2.5 h-2.5" />
                              Wajib Hadir
                            </span>
                          )}
                        </div>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(k)}
                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {k.deskripsi}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {k.tanggalMulai.toDate().toLocaleString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                        {k.tanggalSelesai && ` — ${k.tanggalSelesai.toDate().toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                      {k.lokasi && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {k.lokasi}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1">
                      Oleh: {k.dibuatOlehNama} ({k.dibuatOlehRole})
                    </p>

                    {k.ditanggapiAdmin && k.catatanAdmin && (
                      <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                            Tanggapan Admin
                          </p>
                          <p className="text-xs font-medium text-emerald-800 mt-0.5">{k.catatanAdmin}</p>
                        </div>
                      </div>
                    )}

                    {showAdminTanggap && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold mt-2"
                        onClick={() => handleTanggapiLaporan(k)}
                      >
                        {k.ditanggapiAdmin ? "Edit Tanggapan" : "Tanggapi"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title="Buat Kegiatan Baru"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(KATEGORI_META) as KategoriKegiatan[])
                .filter((k) => isAdmin || k !== "wajib")
                .map((k) => {
                  const meta = KATEGORI_META[k];
                  const active = form.kategori === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm({ ...form, kategori: k })}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition border ${
                        active
                          ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-primary-300"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
            </div>
          </div>

          <Input
            label="Judul Kegiatan"
            placeholder="Contoh: Kerja Bakti Bersama"
            required
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
          />

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Jelaskan kegiatan, tujuan, & informasi penting lainnya..."
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mulai"
              type="datetime-local"
              required
              value={form.tanggalMulai}
              onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
            />
            <Input
              label="Selesai (opsional)"
              type="datetime-local"
              value={form.tanggalSelesai}
              onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
            />
          </div>

          <Input
            label="Lokasi (opsional)"
            placeholder="Aula / Halaman Asrama / Online"
            value={form.lokasi}
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl font-bold border-slate-200"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              className="flex-1 rounded-2xl font-bold"
              onClick={handleSubmit}
              loading={saving}
              icon={<Plus className="w-5 h-5" />}
            >
              Buat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
