"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  UserPlus, Calendar, Clock, User, Phone, Trash2, Filter, Loader2, MessageSquare,
} from "lucide-react";
import { createTamu, getAllTamu, deleteTamu } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Tamu } from "@/types";

type Range = "today" | "7d" | "30d" | "1y" | "all";

const RANGE_LABEL: Record<Range, string> = {
  today: "Hari Ini",
  "7d": "7 Hari Terakhir",
  "30d": "30 Hari Terakhir",
  "1y": "1 Tahun Terakhir",
  all: "Semua",
};

function filterByRange(list: Tamu[], range: Range): Tamu[] {
  if (range === "all") return list;
  const now = Date.now();
  const cutoff: Record<Exclude<Range, "all">, number> = {
    today: now - 24 * 60 * 60 * 1000,
    "7d": now - 7 * 24 * 60 * 60 * 1000,
    "30d": now - 30 * 24 * 60 * 60 * 1000,
    "1y": now - 365 * 24 * 60 * 60 * 1000,
  };
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return list.filter((t) => t.waktuKedatangan.toMillis() >= start.getTime());
  }
  return list.filter((t) => t.waktuKedatangan.toMillis() >= cutoff[range]);
}

export function BukuTamuPage() {
  const { user, userProfile } = useAuth();
  const { success, error } = useToast();
  const [data, setData] = useState<Tamu[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("today");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    namaTamu: "",
    hubungan: "",
    noHpTamu: "",
    untukPenghuni: "",
    keperluan: "",
    waktuKedatangan: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    catatan: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getAllTamu());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filterByRange(data, range);

  const resetForm = () => setForm({
    namaTamu: "",
    hubungan: "",
    noHpTamu: "",
    untukPenghuni: "",
    keperluan: "",
    waktuKedatangan: new Date().toISOString().slice(0, 16),
    catatan: "",
  });

  const handleSubmit = async () => {
    if (!user || !userProfile) return;
    if (!form.namaTamu.trim() || !form.hubungan.trim() || !form.keperluan.trim()) {
      error("Nama tamu, hubungan, dan keperluan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createTamu({
        dilaporOlehUid: user.uid,
        dilaporOlehNama: userProfile.displayName,
        dilaporOlehRole: userProfile.role,
        namaTamu: form.namaTamu.trim(),
        hubungan: form.hubungan.trim(),
        noHpTamu: form.noHpTamu.trim() || undefined,
        untukPenghuni: form.untukPenghuni.trim() || undefined,
        keperluan: form.keperluan.trim(),
        waktuKedatangan: Timestamp.fromDate(new Date(form.waktuKedatangan)),
        catatan: form.catatan.trim() || undefined,
        createdAt: Timestamp.now(),
      });
      success("Tamu berhasil dicatat.");
      setFormOpen(false);
      resetForm();
      await load();
    } catch (err) {
      console.error("Lapor tamu gagal:", err);
      error("Gagal menyimpan data tamu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan tamu ini?")) return;
    try {
      await deleteTamu(id);
      success("Catatan tamu dihapus.");
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menghapus.");
    }
  };

  const isAdmin = userProfile?.role === "admin";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Buku Tamu</h1>
          <p className="text-slate-500 font-medium mt-1">
            Catatan kunjungan tamu ke asrama. Semua penghuni & admin wajib melapor.
          </p>
        </div>
        <Button
          size="md"
          className="rounded-2xl font-bold"
          icon={<UserPlus className="w-5 h-5" />}
          onClick={() => setFormOpen(true)}
        >
          Lapor Tamu
        </Button>
      </div>

      {/* Range filter */}
      <Card className="p-3 bg-white/80 backdrop-blur-md border-none shadow-sm rounded-[2rem]">
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl">
          <Filter className="w-4 h-4 text-primary-600 shrink-0" />
          <div className="flex gap-2 overflow-x-auto">
            {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  range === r
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-white"
                }`}
              >
                {RANGE_LABEL[r]}
              </button>
            ))}
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
            <User className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Belum Ada Tamu</h3>
          <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
            Belum ada catatan tamu pada periode ini. Klik &ldquo;Lapor Tamu&rdquo; untuk menambahkan.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Card key={t.id} className="p-5 md:p-6 border-none shadow-sm rounded-[2rem] bg-white">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary-100 rounded-2xl flex items-center justify-center font-black text-primary-700 shrink-0">
                  {t.namaTamu.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{t.namaTamu}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {t.hubungan}
                        {t.untukPenghuni && ` · untuk ${t.untukPenghuni}`}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {t.waktuKedatangan.toDate().toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    {t.noHpTamu && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {t.noHpTamu}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 font-medium flex items-start gap-2 pt-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                    {t.keperluan}
                  </p>
                  {t.catatan && (
                    <p className="text-xs text-slate-500 italic">&ldquo;{t.catatan}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1">
                    Dilapor oleh: {t.dilaporOlehNama} ({t.dilaporOlehRole})
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title="Lapor Tamu Baru"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nama Tamu"
            placeholder="Nama lengkap tamu"
            required
            value={form.namaTamu}
            onChange={(e) => setForm({ ...form, namaTamu: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hubungan"
              placeholder="Teman / Keluarga / Dosen"
              required
              value={form.hubungan}
              onChange={(e) => setForm({ ...form, hubungan: e.target.value })}
            />
            <Input
              label="No. HP Tamu (opsional)"
              type="tel"
              placeholder="08xx..."
              value={form.noHpTamu}
              onChange={(e) => setForm({ ...form, noHpTamu: e.target.value })}
            />
          </div>
          <Input
            label="Untuk Penghuni (opsional)"
            placeholder="Nama penghuni yang dikunjungi"
            value={form.untukPenghuni}
            onChange={(e) => setForm({ ...form, untukPenghuni: e.target.value })}
          />
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Keperluan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Tujuan kunjungan..."
              value={form.keperluan}
              onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
            />
          </div>
          <Input
            label="Waktu Kedatangan"
            type="datetime-local"
            required
            value={form.waktuKedatangan}
            onChange={(e) => setForm({ ...form, waktuKedatangan: e.target.value })}
          />
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Catatan Tambahan (opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan jika ada..."
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
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
              onClick={handleSubmit}
              loading={saving}
              icon={<Clock className="w-5 h-5" />}
            >
              Catat Tamu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
