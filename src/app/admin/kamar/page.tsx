"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, DoorOpen, Users, Info, Settings, LayoutGrid, Calendar, Phone } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { getAllKamar, createKamar, updateKamar, deleteKamar, getAllPenghuni } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn, formatDate } from "@/lib/utils";
import type { Kamar, StatusKamar, Penghuni } from "@/types";

const fasilitasOptions = ["AC", "Lemari", "Meja Belajar", "Kamar Mandi Dalam", "Kipas Angin", "Dispenser"];
const statusOpts = [
  { value: "tersedia", label: "Tersedia" },
  { value: "penuh", label: "Penuh" },
  { value: "perawatan", label: "Perawatan" },
];

const defaultForm = {
  nomorKamar: "", lantai: 1, jenisKelamin: "L" as "L" | "P",
  kapasitas: 4, terisi: 0, fasilitas: [] as string[], status: "tersedia" as StatusKamar,
};

export default function KamarPage() {
  const { success, error } = useToast();
  const [kamarList, setKamarList] = useState<Kamar[]>([]);
  const [penghuniList, setPenghuniList] = useState<Penghuni[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Kamar | null>(null);
  const [editing, setEditing] = useState<Kamar | null>(null);
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [kData, pData] = await Promise.all([
        getAllKamar(),
        getAllPenghuni(),
      ]);
      setKamarList(kData);
      setPenghuniList(pData);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      error("Gagal memuat data kamar dan penghuni.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModal(true);
  };

  const openEdit = (k: Kamar) => {
    setEditing(k);
    setForm({
      nomorKamar: k.nomorKamar, lantai: k.lantai, jenisKelamin: k.jenisKelamin,
      kapasitas: k.kapasitas, terisi: k.terisi, fasilitas: k.fasilitas, status: k.status,
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.nomorKamar) { error("Nomor kamar wajib diisi"); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateKamar(editing.id, { ...form, updatedAt: Timestamp.now() });
        success("Kamar berhasil diperbarui!");
      } else {
        await createKamar({ ...form, penghuniIds: [], createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
        success("Kamar berhasil ditambahkan!");
      }
      setModal(false);
      load();
    } catch {
      error("Gagal menyimpan kamar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteKamar(deleteModal.id);
      success("Kamar berhasil dihapus.");
      setDeleteModal(null);
      load();
    } catch {
      error("Gagal menghapus kamar.");
    }
  };

  const toggleFasilitas = (f: string) => {
    setForm((prev) => ({
      ...prev,
      fasilitas: prev.fasilitas.includes(f) ? prev.fasilitas.filter((x) => x !== f) : [...prev.fasilitas, f],
    }));
  };

  const stats = {
    total: kamarList.length,
    tersedia: kamarList.filter((k) => k.status === "tersedia").length,
    penuh: kamarList.filter((k) => k.status === "penuh").length,
    perawatan: kamarList.filter((k) => k.status === "perawatan").length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Kamar</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola ketersediaan, fasilitas, dan status hunian asrama.</p>
        </div>
        <Button 
          icon={<Plus className="w-5 h-5" />} 
          onClick={openCreate}
          className="rounded-2xl font-bold px-8 shadow-premium py-6"
        >
          Tambah Kamar Baru
        </Button>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        {[
          { label: "Total Kamar", val: stats.total, color: "bg-white", icon: LayoutGrid, iconColor: "text-slate-400" },
          { label: "Tersedia", val: stats.tersedia, color: "bg-white", icon: DoorOpen, iconColor: "text-primary-600" },
          { label: "Penuh", val: stats.penuh, color: "bg-white", icon: Users, iconColor: "text-red-500" },
          { label: "Perawatan", val: stats.perawatan, color: "bg-white", icon: Settings, iconColor: "text-amber-500" },
        ].map((s, idx) => (
          <Card key={idx} className="p-6 border-none shadow-premium bg-white/80 backdrop-blur-md flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{s.val}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-primary-50", s.iconColor)}>
              <s.icon className="w-6 h-6" />
            </div>
          </Card>
        ))}
      </div>

      {/* Grid Content */}
      <div className="px-2 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Data Kamar...</p>
          </div>
        ) : kamarList.length === 0 ? (
          <Card className="p-20 text-center border-dashed border-2 bg-transparent rounded-[3rem] border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <DoorOpen className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Belum Ada Kamar</h3>
            <p className="text-slate-500 font-medium mt-2">Mulai tambahkan data kamar untuk mengelola penghuni.</p>
            <Button variant="outline" className="mt-8 rounded-2xl font-bold px-8" onClick={openCreate}>Tambah Kamar Pertama</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kamarList.map((k) => {
              const kPenghuni = penghuniList.filter(
                (p) => p.nomorKamar === k.nomorKamar || p.kamarId === k.id
              );
              
              return (
                <Card key={k.id} className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem] flex flex-col group hover:shadow-xl transition-all duration-500">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary-50 rounded-[1.2rem] flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                        <DoorOpen className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">KAMAR {k.nomorKamar}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lantai {k.lantai}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", k.jenisKelamin === "L" ? "text-blue-500" : "text-pink-500")}>
                            {k.jenisKelamin === "L" ? "Putra" : "Putri"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge kamarStatus={k.status} className="scale-110" />
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{k.terisi} / {k.kapasitas} Penghuni</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">{Math.round((k.terisi / k.kapasitas) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-out",
                          k.terisi >= k.kapasitas ? "bg-red-500" : k.terisi > k.kapasitas / 2 ? "bg-amber-500" : "bg-primary-500"
                        )}
                        style={{ width: `${Math.min((k.terisi / k.kapasitas) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Penghuni Mini List */}
                  <div className="mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Penghuni ({kPenghuni.length})</p>
                    {kPenghuni.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {kPenghuni.map((p) => (
                          <div 
                            key={p.id} 
                            className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-xl border border-slate-100 shadow-sm"
                            title={`${p.namaLengkap} - ${p.universitas}`}
                          >
                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[90px]">{p.namaLengkap.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Belum ada penghuni aktif</p>
                    )}
                  </div>

                  {/* Fasilitas pills */}
                  <div className="flex flex-wrap gap-2 mb-8 flex-1">
                    {k.fasilitas.length > 0 ? (
                      k.fasilitas.map((f) => (
                        <span key={f} className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-tight border border-slate-100">
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-slate-300 italic">Belum ada fasilitas</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-6 border-t border-slate-100/80">
                    <Button 
                      variant="ghost" 
                      icon={<Info className="w-3.5 h-3.5" />} 
                      onClick={() => router.push(`/admin/kamar/${k.id}`)} 
                      className="flex-1 rounded-xl font-extrabold text-xs bg-slate-50 hover:bg-sky-50 hover:text-sky-600 px-2 py-2"
                    >
                      Detail
                    </Button>
                    <Button 
                      variant="ghost" 
                      icon={<Edit2 className="w-3.5 h-3.5" />} 
                      onClick={() => openEdit(k)} 
                      className="flex-1 rounded-xl font-extrabold text-xs bg-slate-50 hover:bg-primary-50 hover:text-primary-600 px-2 py-2"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      icon={<Trash2 className="w-3.5 h-3.5" />} 
                      onClick={() => setDeleteModal(k)} 
                      className="flex-1 rounded-xl font-extrabold text-xs bg-slate-50 hover:bg-red-50 hover:text-red-600 px-2 py-2"
                    >
                      Hapus
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>



      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Update Informasi Kamar" : "Pendaftaran Kamar Baru"} size="lg">
        <div className="space-y-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nomor Kamar"
              placeholder="Contoh: A-101"
              value={form.nomorKamar}
              onChange={(e) => setForm((p) => ({ ...p, nomorKamar: e.target.value }))}
              required
              className="rounded-2xl"
            />
            <Input
              label="Posisi Lantai"
              type="number"
              min={1}
              max={10}
              value={form.lantai}
              onChange={(e) => setForm((p) => ({ ...p, lantai: Number(e.target.value) }))}
              className="rounded-2xl"
            />
            <Select
              label="Kategori Penghuni"
              value={form.jenisKelamin}
              onChange={(e) => setForm((p) => ({ ...p, jenisKelamin: e.target.value as "L" | "P" }))}
              options={[{ value: "L", label: "Putra" }, { value: "P", label: "Putri" }]}
              className="rounded-2xl"
            />
            <Input
              label="Kapasitas Maksimal"
              type="number"
              min={1}
              max={10}
              value={form.kapasitas}
              onChange={(e) => setForm((p) => ({ ...p, kapasitas: Number(e.target.value) }))}
              className="rounded-2xl"
            />
            <Select
              label="Status Ketersediaan"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as StatusKamar }))}
              options={statusOpts}
              className="rounded-2xl"
            />
            {editing && (
              <Input
                label="Jumlah Penghuni Saat Ini"
                type="number"
                min={0}
                max={form.kapasitas}
                value={form.terisi}
                onChange={(e) => setForm((p) => ({ ...p, terisi: Number(e.target.value) }))}
                className="rounded-2xl"
              />
            )}
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelengkapan Fasilitas</p>
            <div className="flex flex-wrap gap-2">
              {fasilitasOptions.map((f) => {
                const active = form.fasilitas.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFasilitas(f)}
                    className={cn(
                      "px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 border-2",
                      active 
                        ? "bg-primary-600 text-white border-primary-600 shadow-md scale-105" 
                        : "bg-white text-slate-500 border-slate-50 hover:border-primary-200"
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-50">
            <Button variant="ghost" className="flex-1 font-bold rounded-xl" onClick={() => setModal(false)}>Batal</Button>
            <Button loading={saving} className="flex-1 font-bold rounded-xl shadow-premium" onClick={handleSave}>
              {editing ? "Simpan Perubahan" : "Konfirmasi & Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Konfirmasi Penghapusan">
        <div className="py-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Trash2 className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Hapus Kamar {deleteModal?.nomorKamar}?</h3>
          <p className="text-slate-500 font-medium mt-2 leading-relaxed px-6">
            Tindakan ini bersifat permanen. Seluruh data yang terkait dengan kamar ini akan terhapus dari sistem.
          </p>
          <div className="flex gap-3 mt-10 px-4">
            <Button variant="ghost" className="flex-1 font-bold rounded-xl" onClick={() => setDeleteModal(null)}>Batalkan</Button>
            <Button variant="danger" className="flex-1 font-bold rounded-xl shadow-md" onClick={handleDelete}>Ya, Hapus Data</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
