"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import {
  Plus, ShieldCheck, Ban, Edit2, Trash2, Loader2, Sparkles, ExternalLink, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  getAllTataTertib, createTataTertibItem, updateTataTertibItem,
  deleteTataTertibItem, seedDefaultTataTertib,
} from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { TataTertibItem, KategoriTataTertib } from "@/types";

interface FormState {
  id: string | null;
  kategori: KategoriTataTertib;
  teks: string;
  urutan: number;
}

const EMPTY_FORM: FormState = { id: null, kategori: "kewajiban", teks: "", urutan: 1 };

export default function AdminTataTertibPage() {
  const { success, error } = useToast();
  const [data, setData] = useState<TataTertibItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getAllTataTertib());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const kewajiban = data.filter((d) => d.kategori === "kewajiban");
  const larangan = data.filter((d) => d.kategori === "larangan");

  const openCreate = (kategori: KategoriTataTertib) => {
    const max = data.filter((d) => d.kategori === kategori).reduce((m, d) => Math.max(m, d.urutan), 0);
    setForm({ id: null, kategori, teks: "", urutan: max + 1 });
    setFormOpen(true);
  };

  const openEdit = (item: TataTertibItem) => {
    setForm({ id: item.id, kategori: item.kategori, teks: item.teks, urutan: item.urutan });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.teks.trim()) {
      error("Teks tidak boleh kosong.");
      return;
    }
    setSaving(true);
    try {
      const now = Timestamp.now();
      if (form.id) {
        await updateTataTertibItem(form.id, {
          kategori: form.kategori,
          teks: form.teks.trim(),
          urutan: form.urutan,
        });
        success("Item berhasil diperbarui.");
      } else {
        await createTataTertibItem({
          kategori: form.kategori,
          teks: form.teks.trim(),
          urutan: form.urutan,
          createdAt: now,
          updatedAt: now,
        });
        success("Item berhasil ditambahkan.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: TataTertibItem) => {
    if (!confirm(`Hapus item ini?\n\n"${item.teks}"`)) return;
    try {
      await deleteTataTertibItem(item.id);
      success("Item dihapus.");
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal menghapus.");
    }
  };

  const handleSwap = async (item: TataTertibItem, dir: -1 | 1) => {
    const siblings = data.filter((d) => d.kategori === item.kategori).sort((a, b) => a.urutan - b.urutan);
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swapWith = siblings[idx + dir];
    if (!swapWith) return;
    try {
      await Promise.all([
        updateTataTertibItem(item.id, { urutan: swapWith.urutan }),
        updateTataTertibItem(swapWith.id, { urutan: item.urutan }),
      ]);
      await load();
    } catch (err) {
      console.error(err);
      error("Gagal mengubah urutan.");
    }
  };

  const handleSeed = async () => {
    if (!confirm("Tambahkan template tata tertib default? Hanya dijalankan kalau koleksi kosong.")) return;
    setSeeding(true);
    try {
      const result = await seedDefaultTataTertib();
      if (result.skipped) {
        error("Sudah ada data. Hapus dulu kalau ingin reset.");
      } else {
        success(`${result.created} item template berhasil ditambahkan.`);
        await load();
      }
    } catch (err) {
      console.error(err);
      error("Gagal seed default.");
    } finally {
      setSeeding(false);
    }
  };

  const renderList = (items: TataTertibItem[], kategori: KategoriTataTertib) => {
    const isKewajiban = kategori === "kewajiban";
    const meta = isKewajiban
      ? { Icon: ShieldCheck, color: "emerald", bg: "from-emerald-500 to-emerald-600", label: "Kewajiban" }
      : { Icon: Ban, color: "rose", bg: "from-rose-500 to-rose-600", label: "Larangan" };
    const Icon = meta.Icon;

    return (
      <Card className="overflow-hidden border-none shadow-sm rounded-[2rem] bg-white">
        <div className={`px-6 py-5 bg-gradient-to-br ${meta.bg} text-white flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">{meta.label}</h2>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                {items.length} item
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={`rounded-xl font-bold !bg-white !text-${meta.color}-700 !border-white hover:!bg-white/90`}
            icon={<Plus className="w-4 h-4" />}
            onClick={() => openCreate(kategori)}
          >
            Tambah
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-sm text-slate-400 font-medium">Belum ada item.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {items.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-3 px-6 py-4 group hover:bg-slate-50/50 transition">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 bg-${meta.color}-50 text-${meta.color}-600`}>
                  {idx + 1}
                </div>
                <p className="flex-1 text-sm text-slate-700 font-medium leading-relaxed">{item.teks}</p>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleSwap(item, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Naikkan urutan"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSwap(item, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Turunkan urutan"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-50 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kelola Tata Tertib</h1>
          <p className="text-slate-500 font-medium mt-1">
            Kewajiban dan larangan yang ditampilkan ke publik di halaman{" "}
            <Link href="/tata-tertib" target="_blank" className="font-bold text-primary-600 inline-flex items-center gap-1 hover:underline">
              /tata-tertib <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>
        {data.length === 0 && (
          <Button
            variant="outline"
            size="md"
            className="rounded-2xl font-bold bg-white shadow-sm border-primary-200 text-primary-700"
            icon={<Sparkles className="w-5 h-5" />}
            onClick={handleSeed}
            loading={seeding}
          >
            Seed Template Default
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderList(kewajiban, "kewajiban")}
          {renderList(larangan, "larangan")}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={form.id ? "Edit Item" : "Tambah Item"}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["kewajiban", "larangan"] as KategoriTataTertib[]).map((k) => {
                const active = form.kategori === k;
                const isKew = k === "kewajiban";
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm({ ...form, kategori: k })}
                    className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition border-2 flex items-center justify-center gap-2 ${
                      active
                        ? isKew
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isKew ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    {isKew ? "Kewajiban" : "Larangan"}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Teks <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={form.teks}
              onChange={(e) => setForm({ ...form, teks: e.target.value })}
              placeholder="Contoh: Menjaga ketertiban asrama..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
            />
          </div>

          <Input
            label="Urutan"
            type="number"
            value={form.urutan}
            onChange={(e) => setForm({ ...form, urutan: parseInt(e.target.value, 10) || 1 })}
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
              onClick={handleSave}
              loading={saving}
            >
              {form.id ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
