"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  Plus, AlertCircle, CheckCircle, Clock, XCircle, Loader2, Filter,
  Camera, Trash2, MessageSquare, X, Sparkles,
} from "lucide-react";
import {
  createLaporan, getAllLaporan, getLaporanByUser, updateLaporan, deleteLaporan,
  getPenghuniByUser,
} from "@/lib/firestore";
import { fileToBase64 } from "@/lib/storage";
import { seedLaporanDemo } from "@/lib/seed";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Laporan, StatusLaporan } from "@/types";

const STATUS_META: Record<StatusLaporan, { label: string; color: string; Icon: React.ElementType }> = {
  baru:     { label: "Baru",         color: "bg-sky-50 text-sky-700 border-sky-200",         Icon: AlertCircle },
  diproses: { label: "Diproses",     color: "bg-amber-50 text-amber-700 border-amber-200",   Icon: Clock },
  selesai:  { label: "Selesai",      color: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle },
  ditolak:  { label: "Ditolak",      color: "bg-rose-50 text-rose-700 border-rose-200",       Icon: XCircle },
};

const STATUS_ORDER: StatusLaporan[] = ["baru", "diproses", "selesai", "ditolak"];

const PHOTO_MAX = 800;
const PHOTO_QUALITY = 0.7;
const PHOTO_MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export function LaporanPage() {
  const { user, userProfile } = useAuth();
  const { success, error, info } = useToast();
  const isAdmin = userProfile?.role === "admin";

  const [data, setData] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | StatusLaporan>("semua");
  const [myKamar, setMyKamar] = useState<string | undefined>(undefined);

  // Form create laporan (mahasiswa)
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ judul: "", deskripsi: "" });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Modal tanggapi (admin)
  const [tanggapiOpen, setTanggapiOpen] = useState(false);
  const [savingTanggap, setSavingTanggap] = useState(false);
  const [activeLaporan, setActiveLaporan] = useState<Laporan | null>(null);
  const [tanggapForm, setTanggapForm] = useState<{ status: StatusLaporan; tanggapan: string }>({
    status: "diproses", tanggapan: "",
  });

  // Lightbox foto
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      if (isAdmin && userProfile?.displayName) {
        try {
          await seedLaporanDemo(
            user.uid,
            userProfile.displayName,
            undefined,
            user.uid,
            userProfile.displayName
          );
        } catch (e) {
          console.error("Auto seed failed", e);
        }
      }
      const list = isAdmin ? await getAllLaporan() : await getLaporanByUser(user.uid);
      setData(list);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isAdmin, userProfile]);

  useEffect(() => { load(); }, [load]);

  // Fetch kamar penghuni sekali — dipakai sebagai pelaporKamar saat create laporan
  useEffect(() => {
    if (!user?.uid || isAdmin) return;
    getPenghuniByUser(user.uid)
      .then((p) => setMyKamar(p?.nomorKamar))
      .catch(() => { /* abaikan, kamar tetap undefined */ });
  }, [user?.uid, isAdmin]);

  const filtered = filter === "semua" ? data : data.filter((l) => l.status === filter);

  const handleFotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      error("Ukuran foto maksimal 3 MB.");
      return;
    }
    setUploadingFoto(true);
    try {
      const dataURL = await fileToBase64(file, PHOTO_MAX, PHOTO_QUALITY);
      setFotoPreview(dataURL);
    } catch (err) {
      console.error(err);
      error("Gagal memproses foto.");
    } finally {
      setUploadingFoto(false);
      if (fotoInputRef.current) fotoInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setForm({ judul: "", deskripsi: "" });
    setFotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!user || !userProfile) return;
    if (!form.judul.trim() || !form.deskripsi.trim()) {
      error("Judul dan deskripsi wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const now = Timestamp.now();
      await createLaporan({
        pelaporUid: user.uid,
        pelaporNama: userProfile.displayName,
        ...(myKamar ? { pelaporKamar: myKamar } : {}),
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        ...(fotoPreview ? { fotoUrl: fotoPreview } : {}),
        status: "baru",
        createdAt: now,
        updatedAt: now,
      });
      success("Laporan terkirim. Admin akan menanggapi segera.");
      setFormOpen(false);
      resetForm();
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal mengirim laporan.");
    } finally {
      setSaving(false);
    }
  };

  const openTanggapi = (l: Laporan) => {
    setActiveLaporan(l);
    setTanggapForm({
      status: l.status === "baru" ? "diproses" : l.status,
      tanggapan: l.tanggapanAdmin ?? "",
    });
    setTanggapiOpen(true);
  };

  const handleTanggapi = async () => {
    if (!activeLaporan || !user || !userProfile) return;
    if (!tanggapForm.tanggapan.trim()) {
      error("Tanggapan tidak boleh kosong.");
      return;
    }
    setSavingTanggap(true);
    try {
      await updateLaporan(activeLaporan.id, {
        status: tanggapForm.status,
        tanggapanAdmin: tanggapForm.tanggapan.trim(),
        ditanggapiOlehUid: user.uid,
        ditanggapiOlehNama: userProfile.displayName,
        ditanggapiAt: Timestamp.now(),
      });
      success("Tanggapan tersimpan.");
      setTanggapiOpen(false);
      setActiveLaporan(null);
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menyimpan tanggapan.");
    } finally {
      setSavingTanggap(false);
    }
  };

  const handleDelete = async (l: Laporan) => {
    if (!isAdmin && (l.pelaporUid !== user?.uid || l.status !== "baru")) {
      error("Hanya admin yang bisa menghapus laporan yang sudah ditanggapi.");
      return;
    }
    if (!confirm(`Hapus laporan "${l.judul}"?`)) return;
    try {
      await deleteLaporan(l.id);
      success("Laporan dihapus.");
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menghapus.");
    }
  };



  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAdmin ? "Laporan & Keluhan Penghuni" : "Laporan & Keluhan"}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isAdmin
              ? "Daftar laporan dari penghuni — kasih tanggapan & update status (diproses / selesai / ditolak)."
              : "Lapor kerusakan, keluhan, atau saran ke pengurus asrama. Admin akan menanggapi."}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">

          {!isAdmin && (
            <Button
              size="md"
              className="rounded-2xl font-bold"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => { resetForm(); setFormOpen(true); }}
            >
              Buat Laporan
            </Button>
          )}
        </div>
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
              Semua ({data.length})
            </button>
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_META[s];
              const count = data.filter((l) => l.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                    filter === s ? "bg-primary-600 text-white shadow-sm" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {meta.label} ({count})
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
            <MessageSquare className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Belum Ada Laporan</h3>
          <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
            {isAdmin ? "Belum ada penghuni yang lapor." : "Klik Buat Laporan untuk lapor masalah/keluhan ke pengurus."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((l) => {
            const meta = STATUS_META[l.status];
            const StatusIcon = meta.Icon;
            const canDelete = isAdmin || (l.pelaporUid === user?.uid && l.status === "baru");
            return (
              <Card key={l.id} className="p-5 md:p-6 border-none shadow-sm rounded-[2rem] bg-white">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.color.split(" ")[0]} ${meta.color.split(" ")[1]}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-slate-900">{l.judul}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {l.createdAt.toDate().toLocaleString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(l)}
                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {l.deskripsi}
                    </p>

                    {l.fotoUrl && (
                      <button onClick={() => setLightbox(l.fotoUrl!)} className="block">
                        <img
                          src={l.fotoUrl}
                          alt="foto laporan"
                          className="max-h-48 rounded-2xl border border-slate-100 object-cover hover:scale-[1.02] transition cursor-zoom-in"
                        />
                      </button>
                    )}

                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1">
                      Pelapor: {l.pelaporNama}
                      {l.pelaporKamar && (
                        <span className="ml-2 text-slate-500 bg-slate-100 px-2 py-0.5 rounded normal-case">
                          Kamar {l.pelaporKamar}
                        </span>
                      )}
                    </p>

                    {l.tanggapanAdmin && (
                      <div className="mt-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1.5">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" />
                          Tanggapan Admin
                          {l.ditanggapiOlehNama && (
                            <span className="text-emerald-500 normal-case font-bold text-[10px] tracking-normal">
                              · {l.ditanggapiOlehNama}
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-medium text-emerald-900 leading-relaxed">{l.tanggapanAdmin}</p>
                        {l.ditanggapiAt && (
                          <p className="text-[10px] text-emerald-600 font-bold">
                            {l.ditanggapiAt.toDate().toLocaleString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold mt-2"
                        icon={<MessageSquare className="w-4 h-4" />}
                        onClick={() => openTanggapi(l)}
                      >
                        {l.tanggapanAdmin ? "Update Tanggapan" : "Tanggapi"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Buat Laporan (mahasiswa) */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title="Lapor Masalah / Keluhan"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100 text-xs text-primary-800 font-medium leading-relaxed">
            Sampaikan dengan jelas. Sertakan foto kalau memungkinkan. Admin akan menanggapi
            dengan status: <b>diproses</b>, <b>selesai</b>, atau <b>ditolak</b>.
          </div>

          <Input
            label="Judul"
            placeholder="Mis. Kran wastafel bocor"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            required
          />

          <TextArea
            label="Deskripsi"
            rows={4}
            placeholder="Jelaskan masalah/keluhan secara detail (lokasi, kapan, dll)..."
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            required
          />

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">
              Foto (opsional)
            </label>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoSelect}
              className="hidden"
            />
            {fotoPreview ? (
              <div className="relative inline-block">
                <img src={fotoPreview} alt="preview" className="max-h-44 rounded-2xl border-2 border-slate-200" />
                <button
                  onClick={() => setFotoPreview(null)}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={uploadingFoto}
                className="w-full flex items-center justify-center gap-3 px-4 py-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary-400 hover:bg-primary-50/30 transition text-slate-500 hover:text-primary-700 disabled:opacity-50"
              >
                {uploadingFoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <span className="text-sm font-bold">
                  {uploadingFoto ? "Memproses..." : "Tambah Foto"}
                </span>
              </button>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Max 3 MB. Akan di-compress otomatis.</p>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl font-bold border-slate-200"
              onClick={() => { setFormOpen(false); resetForm(); }}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              className="flex-1 rounded-2xl font-bold"
              icon={<Plus className="w-5 h-5" />}
              onClick={handleSubmit}
              loading={saving}
            >
              Kirim Laporan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Tanggapi Laporan (admin) */}
      <Modal
        open={tanggapiOpen}
        onClose={() => !savingTanggap && setTanggapiOpen(false)}
        title="Tanggapi Laporan"
        size="md"
      >
        <div className="space-y-5">
          {activeLaporan && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Laporan</p>
              <p className="font-bold text-slate-900 mt-1">{activeLaporan.judul}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activeLaporan.deskripsi}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold flex-wrap">
                <span>Pelapor: {activeLaporan.pelaporNama}</span>
                {activeLaporan.pelaporKamar && (
                  <span className="text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Kamar {activeLaporan.pelaporKamar}
                  </span>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">
              Status <span className="text-primary-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["diproses", "selesai", "ditolak"] as StatusLaporan[]).map((s) => {
                const meta = STATUS_META[s];
                const active = tanggapForm.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTanggapForm({ ...tanggapForm, status: s })}
                    className={`px-3 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition border-2 ${
                      active
                        ? s === "selesai"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : s === "ditolak"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <TextArea
            label="Tanggapan"
            rows={4}
            placeholder="Tulis tanggapan untuk pelapor (mis. Insyaallah diperbaiki hari ini, sudah disuruh teknisi, dll)..."
            value={tanggapForm.tanggapan}
            onChange={(e) => setTanggapForm({ ...tanggapForm, tanggapan: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl font-bold border-slate-200"
              onClick={() => setTanggapiOpen(false)}
              disabled={savingTanggap}
            >
              Batal
            </Button>
            <Button
              className="flex-1 rounded-2xl font-bold"
              icon={<MessageSquare className="w-5 h-5" />}
              onClick={handleTanggapi}
              loading={savingTanggap}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lightbox foto */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] bg-slate-950/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox}
            alt="foto laporan"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

