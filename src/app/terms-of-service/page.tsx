"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, FileText, CheckSquare, AlertTriangle, Users, Home, ShieldCheck, ArrowRight, MapPin, Phone, Mail, Menu, X, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function TermsOfServicePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const { userProfile } = useAuth();
  
  const dashboardHref =
    userProfile?.role === "admin" ? "/admin/dashboard" : "/mahasiswa/dashboard";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary-100 selection:text-primary-900 pb-20">
      {/* Navbar dari Halaman Utama */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Asrama Mahasiswa Jambi"
              className="w-11 h-11 object-contain"
            />
            <div className="leading-tight">
              <p className="font-extrabold text-slate-900 text-base tracking-tight">
                Asrama Mahasiswa Jambi
              </p>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">
                Jakarta
              </p>
            </div>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <Link
              href="/#fitur"
              className="hover:text-primary-600 transition-colors"
            >
              Fitur
            </Link>
            <Link
              href="/#cara-daftar"
              className="hover:text-primary-600 transition-colors"
            >
              Panduan
            </Link>
            <Link
              href="/#fasilitas"
              className="hover:text-primary-600 transition-colors"
            >
              Fasilitas
            </Link>
            <Link
              href="/peraturan"
              className="hover:text-primary-600 transition-colors"
            >
              Tata Tertib
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {userProfile ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white text-sm font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-premium hover:scale-[1.02] active:scale-[0.98]"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2.5 text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="px-8 py-3 bg-primary-600 text-white text-sm font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-premium hover:scale-[1.02] active:scale-[0.98]"
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 px-6 py-6 space-y-4 bg-white/95 backdrop-blur-md animate-in slide-in-bottom">
            <Link
              href="/#fitur"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fitur
            </Link>
            <Link
              href="/#cara-daftar"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Panduan
            </Link>
            <Link
              href="/#fasilitas"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fasilitas
            </Link>
            <Link
              href="/peraturan"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tata Tertib
            </Link>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              {userProfile ? (
                <Link
                  href={dashboardHref}
                  className="flex-1 py-3.5 text-center text-sm font-bold bg-primary-600 text-white rounded-2xl shadow-premium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ke Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex-1 py-3.5 text-center text-sm font-bold border-2 border-slate-100 rounded-2xl text-slate-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/daftar"
                    className="flex-1 py-3.5 text-center text-sm font-bold bg-primary-600 text-white rounded-2xl shadow-premium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
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
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-sky-600 shadow-sm border border-slate-100">
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

      </div>

      {/* Footer dari Halaman Utama */}
      <footer className="bg-slate-50 pt-24 pb-12 px-6 border-t border-slate-100 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <img
                  src="/logo.png"
                  alt="Asrama Jambi"
                  className="w-11 h-11 object-contain"
                />
                <span className="font-extrabold text-slate-900 text-xl tracking-tight uppercase">
                  Asrama Jambi App
                </span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                Sistem pendaftaran dan pengelolaan asrama mahasiswa Provinsi
                Jambi di Jakarta yang modern, efisien, dan transparan.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold mb-8 text-sm uppercase tracking-widest">
                Tautan Cepat
              </h4>
              <ul className="space-y-4 font-bold text-sm text-slate-500">
                <li>
                  <Link
                    href="/daftar"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Pendaftaran
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Akses Akun
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#fitur"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Informasi Fitur
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#fasilitas"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Fasilitas Umum
                  </Link>
                </li>
                <li>
                  <Link
                    href="/peraturan"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Tata Tertib & Aturan
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold mb-8 text-sm uppercase tracking-widest">
                Hubungi Kami
              </h4>
              <ul className="space-y-5 font-bold text-sm text-slate-500">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 shrink-0 text-primary-500" />
                  <span>DKI Jakarta, Indonesia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-primary-500" />
                  <span>+62 (21) 0000-0000</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 shrink-0 text-primary-500" />
                  <span>hi@asramajambi.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-sm font-bold">
              © {new Date().getFullYear()} Asrama Mahasiswa Jambi Jakarta. Hak
              Cipta Dilindungi.
            </p>
            <div className="flex flex-wrap gap-6 md:gap-8 text-slate-400 font-bold text-sm">
              <Link
                href="/peraturan"
                className="hover:text-primary-600 transition-colors"
              >
                Tata Tertib
              </Link>
              <Link
                href="/privacy-policy"
                className="hover:text-primary-600 transition-colors"
              >
                Kebijakan Privasi
              </Link>
              <Link
                href="/terms-of-service"
                className="text-primary-600 transition-colors"
              >
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Tombol Scroll to Top (SEO & Smooth Navigation) */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-primary-600 text-white shadow-premium hover:bg-primary-700 hover:scale-110 hover:-translate-y-1 transition-all duration-300 ${
          showScroll ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-6 h-6" />
      </button>
    </div>
  );
}
