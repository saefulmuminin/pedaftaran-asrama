"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, User, BookOpen,
  MapPin, Phone, FileImage, DoorOpen, ShieldCheck, Mail, Calendar, Info
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import {
  getPendaftaranById, updatePendaftaran, getAllKamar,
  createPenghuni, updateKamar, createNotifikasi, getUserProfile,
} from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import type { Pendaftaran, Kamar } from "@/types";

export default function DetailPendaftarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();

  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [kamarList, setKamarList] = useState<Kamar[]>([]);
  const [loading, setLoading] = useState(true);

  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);

  const [selectedKamar, setSelectedKamar] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [p, k] = await Promise.all([getPendaftaranById(id), getAllKamar()]);
      setPendaftaran(p);
      setKamarList(k);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleVerify = async () => {
    if (!pendaftaran) return;
    setActionLoading(true);
    try {
      await updatePendaftaran(id, {
        status: "diverifikasi",
        diverifikasiAt: Timestamp.now(),
      });
      await createNotifikasi({
        userId: pendaftaran.userId,
        judul: "Pendaftaran Sedang Diverifikasi",
        pesan: "Tim kami sedang memverifikasi data pendaftaran Anda. Mohon tunggu konfirmasi selanjutnya.",
        tipe: "info",
        dibaca: false,
        createdAt: Timestamp.now(),
      });
      setPendaftaran((prev) => prev ? { ...prev, status: "diverifikasi" } : null);
      setVerifyModal(false);
      success("Status diperbarui: Sedang Diverifikasi");
    } catch {
      error("Gagal memperbarui status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!pendaftaran || !selectedKamar) {
      error("Pilih kamar terlebih dahulu");
      return;
    }
    setActionLoading(true);
    try {
      const kamar = kamarList.find((k) => k.id === selectedKamar);
      await updatePendaftaran(id, {
        status: "diterima",
        diterimaAt: Timestamp.now(),
        nomorKamar: kamar?.nomorKamar,
      });

      await createPenghuni({
        pendaftaranId: id,
        userId: pendaftaran.userId,
        namaLengkap: pendaftaran.namaLengkap,
        nim: pendaftaran.nim,
        universitas: pendaftaran.universitas,
        noHp: pendaftaran.noHp,
        nomorKamar: kamar?.nomorKamar ?? "",
        kamarId: selectedKamar,
        tanggalMasuk: Timestamp.now(),
        status: "aktif",
        createdAt: Timestamp.now(),
      });

      if (kamar) {
        await updateKamar(selectedKamar, {
          terisi: kamar.terisi + 1,
          penghuniIds: [...(kamar.penghuniIds ?? []), pendaftaran.userId],
          status: kamar.terisi + 1 >= kamar.kapasitas ? "penuh" : "tersedia",
        });
      }

      await createNotifikasi({
        userId: pendaftaran.userId,
        judul: "Pendaftaran Diterima!",
        pesan: `Selamat! Pendaftaran Anda telah diterima. Anda ditempatkan di kamar ${kamar?.nomorKamar ?? "-"}.`,
        tipe: "success",
        dibaca: false,
        createdAt: Timestamp.now(),
      });

      setPendaftaran((prev) => prev ? { ...prev, status: "diterima", nomorKamar: kamar?.nomorKamar } : null);
      setApproveModal(false);
      success("Pendaftar berhasil diterima!");
    } catch {
      error("Gagal memproses penerimaan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!pendaftaran) return;
    setActionLoading(true);
    try {
      await updatePendaftaran(id, {
        status: "ditolak",
        ditolakAt: Timestamp.now(),
        catatanAdmin: rejectNote,
      });
      await createNotifikasi({
        userId: pendaftaran.userId,
        judul: "Pendaftaran Tidak Dapat Diproses",
        pesan: rejectNote || "Maaf, pendaftaran Anda tidak dapat kami proses saat ini.",
        tipe: "error",
        dibaca: false,
        createdAt: Timestamp.now(),
      });
      setPendaftaran((prev) => prev ? { ...prev, status: "ditolak", catatanAdmin: rejectNote } : null);
      setRejectModal(false);
      success("Pendaftar ditandai ditolak.");
    } catch {
      error("Gagal memperbarui status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Detail...</p>
      </div>
    );
  }

  if (!pendaftaran) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <Info className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Data Tidak Ditemukan</h3>
        <Button variant="ghost" onClick={() => router.back()} className="mt-8 font-bold">Kembali</Button>
      </div>
    );
  }

  const availableKamar = kamarList.filter(
    (k) => k.jenisKelamin === (pendaftaran.jenisKelamin === "L" ? "L" : "P") && k.status === "tersedia"
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      {/* Header Detail */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <button onClick={() => router.back()} className="p-3 rounded-2xl text-slate-400 bg-white border border-slate-100 hover:text-primary-600 hover:bg-primary-50 transition-all shadow-sm group">
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-[1.2rem] flex items-center justify-center font-black text-2xl text-primary-700 shadow-premium">
              {pendaftaran.namaLengkap.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">{pendaftaran.namaLengkap}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{pendaftaran.nim}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{pendaftaran.universitas}</span>
              </div>
            </div>
          </div>
        </div>
        <Badge status={pendaftaran.status} className="scale-125 origin-right" />
      </div>

      {/* Action Banner */}
      <div className="px-2">
        {pendaftaran.status === "submitted" && (
          <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-100 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-tight">Menunggu Verifikasi Data</p>
                <p className="text-slate-500 text-sm font-medium mt-1 leading-relaxed">Tinjau seluruh dokumen pendaftar sebelum menentukan keputusan akhir.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button icon={<ShieldCheck className="w-4 h-4" />} variant="secondary" className="rounded-xl font-bold bg-white text-amber-600 border-amber-100" onClick={() => setVerifyModal(true)}>
                Tandai Diverifikasi
              </Button>
              <Button icon={<CheckCircle className="w-4 h-4" />} className="rounded-xl font-bold px-6 shadow-premium" onClick={() => setApproveModal(true)}>
                Terima Sekarang
              </Button>
              <Button icon={<XCircle className="w-4 h-4" />} variant="danger" className="rounded-xl font-bold bg-white text-red-500 border-red-50 hover:bg-red-50" onClick={() => setRejectModal(true)}>
                Tolak
              </Button>
            </div>
          </div>
        )}

        {pendaftaran.status === "diverifikasi" && (
          <div className="bg-primary-50/50 backdrop-blur-sm border border-primary-100 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-slate-900 font-extrabold tracking-tight">Data Sedang Diverifikasi</p>
                <p className="text-slate-500 text-sm font-medium mt-1 leading-relaxed">Pastikan ketersediaan kamar mencukupi sebelum menyetujui pendaftaran ini.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button icon={<CheckCircle className="w-4 h-4" />} className="rounded-xl font-bold px-8 shadow-premium" onClick={() => setApproveModal(true)}>
                Terima Pendaftar
              </Button>
              <Button icon={<XCircle className="w-4 h-4" />} variant="danger" className="rounded-xl font-bold bg-white text-red-500 border-red-50 hover:bg-red-50" onClick={() => setRejectModal(true)}>
                Tolak
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 md:p-10 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Informasi Personal</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                { label: "Nama Lengkap", value: pendaftaran.namaLengkap, icon: User },
                { label: "Identitas Kependudukan (NIK)", value: pendaftaran.nik, icon: ShieldCheck },
                { label: "Tempat, Tanggal Lahir", value: `${pendaftaran.tempatLahir}, ${formatDate(pendaftaran.tanggalLahir)}`, icon: Calendar },
                { label: "Jenis Kelamin", value: pendaftaran.jenisKelamin === "L" ? "Laki-laki" : "Perempuan", icon: Info },
                { label: "Agama", value: pendaftaran.agama, icon: Info },
                { label: "Golongan Darah", value: pendaftaran.golonganDarah, icon: Info },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.label}</p>
                  <p className="text-slate-800 font-bold leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 md:p-10 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Akademik & Pendidikan</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                { label: "Nomor Induk Mahasiswa", value: pendaftaran.nim },
                { label: "Perguruan Tinggi", value: pendaftaran.universitas },
                { label: "Fakultas / Departemen", value: pendaftaran.fakultas },
                { label: "Program Studi", value: pendaftaran.jurusan },
                { label: "Semester Berjalan", value: `Semester ${pendaftaran.semester}` },
                { label: "Indeks Prestasi Kumulatif", value: pendaftaran.ipk },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.label}</p>
                  <p className="text-slate-800 font-bold leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 md:p-10 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Domisili & Alamat</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-1.5 md:col-span-2">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Alamat Lengkap Asal</p>
                <p className="text-slate-800 font-bold leading-relaxed">{pendaftaran.alamatAsal}</p>
              </div>
              {[
                { label: "Kabupaten/Kota", value: pendaftaran.kabupatenAsal },
                { label: "Email Korespondensi", value: pendaftaran.email, icon: Mail },
                { label: "Nomor WhatsApp", value: pendaftaran.noHp, icon: Phone },
                { label: "Preferensi Gedung", value: pendaftaran.preferensiKamar === "putra" ? "Gedung Putra" : "Gedung Putri" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.label}</p>
                  <p className="text-slate-800 font-bold leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Phone className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Kontak Darurat</h3>
            </div>
            
            <div className="space-y-6">
              {[
                { label: "Orang Tua / Wali", value: pendaftaran.namaOrtu },
                { label: "Hubungan Keluarga", value: pendaftaran.hubunganOrtu },
                { label: "No. HP Darurat", value: pendaftaran.noHpOrtu },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.label}</p>
                  <p className="text-slate-800 font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                <FileImage className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Berkas Digital</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Pas Foto Terbaru", url: pendaftaran.fotoUrl },
                { label: "KTP (Digital)", url: pendaftaran.ktpUrl },
                { label: "Kartu Mahasiswa", url: pendaftaran.ktmUrl },
                { label: "Surat Keterangan Aktif", url: pendaftaran.suratKeteranganUrl },
              ].map((doc, idx) => (
                <div key={idx}>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-primary-50 hover:border-primary-100 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:text-primary-600">
                          <FileImage className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 group-hover:text-primary-700">{doc.label}</span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl grayscale opacity-50">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <FileImage className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 italic">Belum Diupload</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 border-none shadow-premium bg-primary-600 text-white rounded-[2.5rem]">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-4">Motivasi & Alasan</h4>
            <p className="text-sm font-medium leading-relaxed italic">
              "{pendaftaran.alasanMasukAsrama}"
            </p>
          </Card>
        </div>
      </div>

      {/* Verify Modal */}
      <Modal open={verifyModal} onClose={() => setVerifyModal(false)} title="Verifikasi Pendaftaran">
        <div className="space-y-4 py-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-slate-600 text-center font-medium leading-relaxed px-4">
            Apakah Anda yakin ingin menandai data <span className="font-bold text-slate-900">{pendaftaran.namaLengkap}</span> sebagai sedang diverifikasi?
          </p>
          <div className="flex gap-3 mt-8">
            <Button variant="ghost" className="flex-1 font-bold rounded-xl" onClick={() => setVerifyModal(false)}>Batalkan</Button>
            <Button loading={actionLoading} className="flex-1 font-bold rounded-xl shadow-premium" onClick={handleVerify}>Ya, Verifikasi</Button>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Penerimaan Penghuni">
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-2xl border border-primary-100">
            <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <p className="text-xs text-primary-800 font-bold leading-relaxed">
              Silakan pilih penempatan kamar yang sesuai dengan gedung <span className="uppercase">{pendaftaran.preferensiKamar}</span>.
            </p>
          </div>

          {availableKamar.length === 0 ? (
            <div className="bg-red-50 rounded-2xl p-6 text-center">
              <DoorOpen className="w-10 h-10 text-red-200 mx-auto mb-3" />
              <p className="text-sm text-red-600 font-bold">Maaf, saat ini tidak ada kamar tersedia yang sesuai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto px-1 pr-3 scrollbar-hide">
              {availableKamar.map((k) => (
                <label key={k.id} className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                  selectedKamar === k.id 
                    ? "border-primary-600 bg-primary-50 shadow-md" 
                    : "border-slate-50 bg-slate-50 hover:border-slate-200"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedKamar === k.id ? "border-primary-600" : "border-slate-300"
                    )}>
                      {selectedKamar === k.id && <div className="w-2 h-2 bg-primary-600 rounded-full animate-in zoom-in-50" />}
                    </div>
                    <div>
                      <p className={cn("font-black tracking-tight", selectedKamar === k.id ? "text-primary-700" : "text-slate-700")}>KAMAR {k.nomorKamar}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Lantai {k.lantai}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-500">{k.terisi} / {k.kapasitas}</p>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                        style={{ width: `${(k.terisi / k.kapasitas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <input type="radio" name="kamar" value={k.id} checked={selectedKamar === k.id} onChange={() => setSelectedKamar(k.id)} className="sr-only" />
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <Button variant="ghost" className="flex-1 font-bold rounded-xl" onClick={() => setApproveModal(false)}>Tutup</Button>
            <Button loading={actionLoading} disabled={!selectedKamar} className="flex-1 font-bold rounded-xl shadow-premium" onClick={handleApprove}>
              Konfirmasi Penerimaan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Penolakan Pendaftaran">
        <div className="space-y-6 py-4">
          <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <p className="text-xs text-red-700 font-bold leading-relaxed">
              Memberikan penolakan akan mengirimkan notifikasi resmi kepada pendaftar. Harap berikan alasan yang jelas.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Penolakan</label>
            <textarea
              rows={4}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Contoh: Dokumen tidak valid atau kapasitas asrama penuh."
              className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-red-200 focus:bg-white transition-all resize-none shadow-inner"
            />
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="ghost" className="flex-1 font-bold rounded-xl" onClick={() => setRejectModal(false)}>Batalkan</Button>
            <Button variant="danger" loading={actionLoading} className="flex-1 font-bold rounded-xl shadow-md" onClick={handleReject}>Konfirmasi Penolakan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
