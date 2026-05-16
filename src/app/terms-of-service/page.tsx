"use client";

import Link from "next/link";
import { ArrowLeft, FileText, CheckSquare, AlertTriangle, Users, Home, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary-100 selection:text-primary-900 pb-20">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <span className="font-black text-slate-900 tracking-tight text-xs uppercase">Ketentuan Layanan</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-16 space-y-12 animate-in fade-in slide-in-bottom duration-700">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Syarat & Ketentuan</h1>
          <p className="text-slate-500 font-medium">Terakhir diperbarui: 10 Mei 2026</p>
        </div>

        {/* Warning Card */}
        <Card className="p-8 border-none shadow-premium bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileText className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
               <AlertTriangle className="w-6 h-6 text-amber-400" />
               Penting Untuk Dibaca
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Dengan mengakses dan mendaftar pada sistem Asrama Mahasiswa Jambi Jakarta, Anda menyetujui untuk 
              terikat oleh syarat dan ketentuan berikut. Mohon baca dengan seksama sebelum melanjutkan pendaftaran.
            </p>
          </div>
        </Card>

        {/* Content Sections */}
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-100">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">1. Kualifikasi Pendaftar</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6 text-slate-600 leading-relaxed font-medium text-sm">
              <p>Pendaftar asrama wajib memenuhi kriteria dasar berikut:</p>
              <ul className="grid grid-cols-1 gap-4">
                {[
                  "Mahasiswa aktif asal Provinsi Jambi yang dibuktikan dengan KTP/KK.",
                  "Sedang menempuh pendidikan tinggi (S1/D3) di perguruan tinggi di wilayah Jakarta dan sekitarnya.",
                  "Belum menikah dan bersedia menaati seluruh peraturan asrama.",
                  "Bukan merupakan pengguna narkoba atau terlibat dalam kegiatan kriminal.",
                  "Memiliki motivasi belajar yang tinggi dan semangat kekeluargaan."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckSquare className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">2. Kebenaran Data</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm text-slate-600 leading-relaxed font-medium text-sm space-y-4">
              <p>
                Seluruh data yang diisi dan dokumen yang diunggah harus merupakan data yang benar, akurat, dan terbaru. 
                Pemalsuan data atau dokumen dapat menyebabkan pembatalan pendaftaran secara sepihak oleh pengurus asrama.
              </p>
              <p>
                Pengurus berhak melakukan verifikasi lapangan atau konfirmasi ke pihak kampus terkait kebenaran data 
                yang diberikan oleh pendaftar.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm border border-slate-100">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">3. Aturan Tinggal</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm text-slate-600 leading-relaxed font-medium text-sm space-y-4">
              <p>Mahasiswa yang dinyatakan diterima wajib:</p>
              <ul className="space-y-3">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0" />
                  <span>Menjaga kebersihan, ketertiban, dan kenyamanan lingkungan asrama.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0" />
                  <span>Mengikuti kegiatan rutin yang diselenggarakan oleh pengurus asrama.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0" />
                  <span>Membayar iuran bulanan (jika ada) sesuai dengan ketentuan yang berlaku.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0" />
                  <span>Tidak membawa tamu lawan jenis ke dalam kamar asrama.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-slate-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">4. Pembatalan & Sanksi</h3>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm text-slate-600 leading-relaxed font-medium text-sm space-y-4">
              <p>
                Pengurus asrama berhak memberikan sanksi mulai dari teguran hingga pengeluaran dari asrama 
                apabila penghuni terbukti melanggar aturan yang telah ditetapkan.
              </p>
              <p>
                Status kepenghunian dapat dibatalkan apabila mahasiswa sudah tidak aktif kuliah, lulus, 
                atau telah melampaui batas maksimal waktu tinggal yang ditentukan.
              </p>
            </div>
          </section>
        </div>

        {/* Contact Footer */}
        <div className="pt-12 border-t border-slate-200 text-center space-y-4">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pertanyaan Mengenai Ketentuan?</p>
          <p className="text-slate-600 font-medium text-sm">
            Hubungi pengurus asrama melalui email di <span className="text-primary-600 font-black">support@asramajambi.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
