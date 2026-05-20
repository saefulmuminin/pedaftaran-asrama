"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle, Clock, XCircle, FileText, User,
  BookOpen, MapPin, Phone, FileImage, ArrowRight, Info, ShieldCheck, Mail, Calendar, GraduationCap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPendaftaranByUser } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import type { Pendaftaran } from "@/types";

export default function StatusPage() {
  const { userProfile } = useAuth();
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userProfile) return;
      const p = await getPendaftaranByUser(userProfile.uid);
      setPendaftaran(p);
      setLoading(false);
    };
    load();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Status...</p>
      </div>
    );
  }

  if (!pendaftaran) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 px-6 animate-in fade-in slide-in-bottom duration-700">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
          <FileText className="w-10 h-10 text-slate-200" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Belum Ada Pendaftaran</h2>
        <p className="text-slate-500 font-medium leading-relaxed mb-10">
          Anda belum mengisi formulir pendaftaran asrama. Silakan lengkapi data Anda untuk memulai proses seleksi.
        </p>
        <Link href="/mahasiswa/pendaftaran">
          <Button size="lg" className="rounded-2xl font-bold px-10 shadow-premium group">
            Mulai Pendaftaran <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    );
  }

  const timeline = [
    {
      label: "Pendaftaran Dibuat",
      description: "Draft formulir telah dibuat.",
      date: pendaftaran.createdAt,
      done: true,
      icon: FileText,
    },
    {
      label: "Formulir Terkirim",
      description: "Data Anda sedang menunggu verifikasi awal.",
      date: pendaftaran.submittedAt,
      done: !!pendaftaran.submittedAt,
      icon: ShieldCheck,
    },
    {
      label: "Tahap Verifikasi",
      description: "Tim admin sedang meninjau dokumen Anda.",
      date: pendaftaran.diverifikasiAt,
      done: !!pendaftaran.diverifikasiAt,
      icon: Clock,
    },
    {
      label: pendaftaran.status === "ditolak" ? "Hasil Seleksi" : "Status Penerimaan",
      description: pendaftaran.status === "ditolak" ? "Pendaftaran belum dapat diterima." : pendaftaran.status === "diterima" ? "Selamat! Anda dinyatakan diterima." : "Menunggu keputusan akhir.",
      date: pendaftaran.diterimaAt ?? pendaftaran.ditolakAt,
      done: pendaftaran.status === "diterima" || pendaftaran.status === "ditolak",
      icon: pendaftaran.status === "ditolak" ? XCircle : CheckCircle,
      isEnd: true,
      isReject: pendaftaran.status === "ditolak",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Status Pendaftaran</h1>
          <p className="text-slate-500 font-medium mt-1">Pantau perkembangan seleksi hunian asrama Anda secara real-time.</p>
        </div>
        <Badge status={pendaftaran.status} className="scale-125 origin-right" />
      </div>

      {/* Hero Status Banner */}
      {pendaftaran.status === "diterima" && (
        <div className="bg-primary-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight leading-tight">Selamat! Anda Diterima</h3>
              <p className="text-primary-100 font-medium mt-2 leading-relaxed opacity-90">
                Pendaftaran Anda telah disetujui. Selamat bergabung sebagai bagian dari keluarga Asrama Mahasiswa Jambi.
              </p>
              {pendaftaran.nomorKamar && (
                <div className="mt-6 inline-flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Penempatan Kamar</span>
                  <span className="text-xl font-black tracking-tight">{pendaftaran.nomorKamar}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pendaftaran.status === "ditolak" && (
        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="relative flex items-start gap-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Pendaftaran Belum Dapat Diterima</h3>
              <p className="text-slate-600 font-medium mt-2 leading-relaxed italic">
                "{pendaftaran.catatanAdmin || "Maaf, pendaftaran Anda belum memenuhi kriteria seleksi periode ini."}"
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Column */}
        <div className="lg:col-span-1">
          <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mb-8">Riwayat Proses</h2>
            <div className="space-y-2">
              {timeline.map((item, i) => {
                const Icon = item.icon;
                const active = item.done;
                return (
                  <div key={i} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-500",
                        active
                          ? item.isReject
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-primary-50 text-primary-600 border border-primary-100"
                          : "bg-slate-50 text-slate-300 border border-slate-50"
                      )}>
                        <Icon className={cn("w-5 h-5", active && "animate-in zoom-in-50")} />
                      </div>
                      {i < timeline.length - 1 && (
                        <div className={cn(
                          "w-0.5 flex-1 my-2 transition-colors duration-500",
                          active ? "bg-primary-200" : "bg-slate-100"
                        )} />
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={cn(
                        "text-sm font-black uppercase tracking-tight",
                        active ? "text-slate-900" : "text-slate-300"
                      )}>
                        {item.label}
                      </p>
                      {item.date ? (
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{formatDateTime(item.date)}</p>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">Belum Terlewati</p>
                      )}
                      {active && (
                        <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-50">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Biodata</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Nama Lengkap", value: pendaftaran.namaLengkap },
                  { label: "NIK / Identitas", value: pendaftaran.nik },
                  { label: "Jenis Kelamin", value: pendaftaran.jenisKelamin === "L" ? "Laki-laki" : "Perempuan" },
                  { label: "Agama", value: pendaftaran.agama },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{item.label}</p>
                    <p className="text-sm font-bold text-slate-700">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-50">
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Akademik</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Nomor Induk (NIM)", value: pendaftaran.nim },
                  { label: "Universitas", value: pendaftaran.universitas },
                  { label: "Program Studi", value: pendaftaran.jurusan },
                  { label: "IPK Terakhir", value: pendaftaran.ipk },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{item.label}</p>
                    <p className="text-sm font-bold text-slate-700">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                <FileImage className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Berkas Pendaftaran</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Foto Profil", url: pendaftaran.fotoUrl },
                { label: "Dokumen KTP", url: pendaftaran.ktpUrl },
                { label: "Kartu Mahasiswa", url: pendaftaran.ktmUrl },
                { label: "Surat Aktif", url: pendaftaran.suratKeteranganUrl },
              ].map((doc, idx) => (
                <div key={idx}>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-primary-50 hover:border-primary-100 hover:text-primary-600 transition-all group shadow-sm"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:shadow-md transition-all">
                        <FileImage className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight text-center">{doc.label}</span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl opacity-40 grayscale">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300">
                        <FileImage className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight text-center italic">Kosong</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
