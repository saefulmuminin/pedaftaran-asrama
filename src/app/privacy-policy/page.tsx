"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary-100 selection:text-primary-900 pb-20">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <span className="font-black text-slate-900 tracking-tight text-xs uppercase">Pusat Privasi</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-16 space-y-12 animate-in fade-in slide-in-bottom duration-700">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Kebijakan Privasi</h1>
          <p className="text-slate-500 font-medium">Terakhir diperbarui: 10 Mei 2026</p>
        </div>

        {/* Introduction Card */}
        <Card className="p-8 border-none shadow-premium bg-primary-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Lock className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-black tracking-tight">Komitmen Kami Terhadap Data Anda</h2>
            <p className="text-primary-50 text-sm leading-relaxed opacity-90">
              Privasi Anda adalah prioritas utama kami. Dokumen ini menjelaskan bagaimana kami mengumpulkan, 
              menggunakan, dan melindungi informasi pribadi Anda saat menggunakan sistem pendaftaran 
              Asrama Mahasiswa Jambi Jakarta.
            </p>
          </div>
        </Card>

        {/* Content Sections */}
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-100">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">1. Informasi yang Kami Kumpulkan</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-4 text-slate-600 leading-relaxed font-medium text-sm">
              <p>Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar, termasuk namun tidak terbatas pada:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Identitas Pribadi (Nama, NIK, Tempat/Tgl Lahir)",
                  "Data Akademik (Kampus, NIM, Semester)",
                  "Informasi Kontak (Email, No. WhatsApp)",
                  "Dokumen Digital (KTM, KTP, Surat Pernyataan)",
                  "Data Orang Tua/Wali",
                  "Informasi Asal Daerah di Jambi"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">2. Penggunaan Informasi</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-4 text-slate-600 leading-relaxed font-medium text-sm">
              <p>Informasi yang kami kumpulkan digunakan untuk tujuan berikut:</p>
              <ul className="space-y-3">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 shrink-0" />
                  <span>Memproses pendaftaran dan verifikasi kelayakan penghuni asrama.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 shrink-0" />
                  <span>Mengelola database penghuni asrama yang aktif.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 shrink-0" />
                  <span>Mengirimkan notifikasi penting terkait status pendaftaran dan pengumuman asrama.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 shrink-0" />
                  <span>Laporan internal pengurus asrama kepada Pemerintah Daerah Provinsi Jambi.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-slate-100">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">3. Keamanan Data</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm text-slate-600 leading-relaxed font-medium text-sm space-y-4">
              <p>
                Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasional untuk melindungi data Anda dari akses, 
                penggunaan, atau pengungkapan yang tidak sah. Data Anda disimpan di server terenkripsi yang aman.
              </p>
              <p>
                Akses ke data pribadi Anda hanya dibatasi kepada administrator dan pengurus asrama yang berkepentingan 
                dalam proses seleksi dan pengelolaan asrama.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">4. Hak Pengguna</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm text-slate-600 leading-relaxed font-medium text-sm space-y-4">
              <p>Sebagai pengguna, Anda memiliki hak untuk:</p>
              <ul className="space-y-3">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
                  <span>Mengakses dan memperbarui data pribadi Anda melalui dashboard profil.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
                  <span>Menarik kembali berkas pendaftaran selama proses verifikasi belum selesai.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
                  <span>Menanyakan perihal penggunaan data Anda kepada administrator.</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Contact Footer */}
        <div className="pt-12 border-t border-slate-200 text-center space-y-4">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ada Pertanyaan?</p>
          <p className="text-slate-600 font-medium text-sm">
            Hubungi kami melalui email di <span className="text-primary-600 font-black">privacy@asramajambi.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
