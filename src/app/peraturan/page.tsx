"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  AlertOctagon,
  Home,
  Users,
  Building,
  Info,
  Calendar,
  DollarSign,
  Clock,
  Volume2,
  Lock,
  ArrowRight,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  ArrowUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PeraturanPage() {
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
    <div className="min-h-screen bg-slate-50 selection:bg-primary-100 selection:text-primary-900">
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
              className="text-primary-600 transition-colors"
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
              className="block text-base font-bold text-primary-600 py-2"
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

      {/* Hero Section */}
      <header className="relative py-20 px-6 bg-slate-900 overflow-hidden text-center">
        <div className="absolute inset-0 bg-linear-to-r from-primary-600/10 to-rose-600/10 opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <span className="px-4 py-1.5 bg-primary-500/10 text-primary-400 font-extrabold text-xs uppercase tracking-[0.2em] rounded-full border border-primary-500/20">
            Regulasi & Informasi
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Tata Tertib & Kewajiban <br />
            <span className="bg-linear-to-r from-primary-400 to-rose-400 bg-clip-text text-transparent">
              Penghuni Asrama
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto font-medium text-base md:text-lg leading-relaxed">
            Demi kenyamanan, ketertiban, dan keamanan bersama, seluruh mahasiswa penghuni Asrama Mahasiswa Jambi Jakarta wajib memahami dan mematuhi tata tertib di bawah ini.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        
        {/* Ringkasan & Informasi Umum */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 z-0 opacity-50" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Tentang Asrama Kami
                </h2>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed text-base">
                Asrama Mahasiswa Jambi Jakarta dikelola langsung oleh <strong>Pemerintah Provinsi Jambi</strong> sebagai fasilitas penunjang bagi mahasiswa asal Provinsi Jambi yang sedang menempuh pendidikan tinggi di wilayah Jakarta. Regulasi mengenai pengelolaan dan tarif asrama ini telah diatur secara resmi setidaknya sejak tahun 2010.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Kamar Tersedia</span>
                  <span className="text-2xl font-black text-slate-800">17 Kamar</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Penghuni Aktif</span>
                  <span className="text-2xl font-black text-slate-800">± 30 Mahasiswa</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Users, label: "Kapasitas Kamar", desc: "Rata-rata diisi 1 - 2 orang per kamar." },
                { icon: Home, label: "Aula & Musholah", desc: "Tersedia 1 ruang pertemuan/Aula & Musholah bersama." },
                { icon: Calendar, label: "Regulasi Sejak 2010", desc: "Dikelola & diatur resmi oleh Pemprov Jambi." },
                { icon: Info, label: "Fasilitas Toilet", desc: "Tersedia 5 toilet di lantai bawah & 5 toilet di lantai atas." },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 p-6 rounded-2xl border border-slate-100/80 transition-all duration-300 space-y-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <item.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">{item.label}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dua Kolom: Kewajiban vs Larangan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          
          {/* Kewajiban Section */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kewajiban Penghuni</h2>
                <p className="text-sm text-slate-500 font-medium">Harap dilaksanakan dengan penuh tanggung jawab</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { title: "Menjaga Nama Baik & Ketertiban", desc: "Menjaga nama baik, ketertiban, dan keamanan lingkungan asrama setiap saat." },
                { title: "Memelihara Barang Inventaris", desc: "Menjaga dan memelihara seluruh fasilitas serta barang-barang inventaris asrama dengan baik." },
                { title: "Melaporkan Kegiatan Asrama", desc: "Melaporkan segala bentuk kegiatan yang berkaitan dengan asrama kepada pengurus." },
                { title: "Berpakaian Rapi & Pantas", desc: "Berpakaian yang rapi dan pantas (sopan) saat berada di lingkungan asrama." },
                { title: "Membayar Uang Bulanan Rp 70.000", desc: "Membayar kontribusi bulanan asrama bagi seluruh penghuni asrama tepat waktu." },
                { title: "Saling Menghormati", desc: "Menghormati kawan-kawan yang sedang belajar dan menunaikan ibadah dengan tenang." },
                { title: "Mengikuti Kegiatan Asrama", desc: "Mengikuti dan melaksanakan kegiatan asrama seperti kerja bakti, rapat, dan kegiatan lainnya." },
                { title: "Melaporkan Tamu Berkunjung", desc: "Melaporkan setiap tamu yang datang berkunjung kepada pengurus asrama." },
                { title: "Mengunci Pagar Asrama", desc: "Selalu mengunci pagar saat keluar maupun masuk demi keamanan bersama." },
              ].map((kw, idx) => (
                <div key={idx} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all duration-200 group">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-black text-sm flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">{kw.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{kw.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Larangan Section */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertOctagon className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Larangan Keras</h2>
                <p className="text-sm text-slate-500 font-medium">Tindakan berikut sangat dilarang di lingkungan asrama</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: Lock, title: "Miras, Narkoba & Zat Adiktif", desc: "Membawa, mengedarkan, dan mengkonsumsi minuman keras atau narkoba di asrama." },
                { icon: AlertOctagon, title: "Perjudian", desc: "Dilarang keras melakukan segala bentuk perjudian di lingkungan asrama." },
                { icon: Users, title: "Aturan Kunjungan Kamar", desc: "Dilarang membawa wanita ke dalam kamar kecuali muhrim (dalam keadaan pintu tertutup)." },
                { icon: Clock, title: "Jam Berkunjung Teman Wanita", desc: "Waktu berkunjung teman wanita dibatasi hanya dari pukul 07:00 pagi s/d 11:00 malam." },
                { icon: Volume2, title: "Mengganggu Ketenangan", desc: "Membunyikan radio, TV, atau speaker dengan keras saat jam belajar, ibadah, atau istirahat." },
                { icon: Users, title: "Membawa Teman Menginap", desc: "Dilarang membawa teman untuk menginap tanpa sepengetahuan dan izin dari pengurus asrama." },
              ].map((lr, idx) => (
                <div key={idx} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all duration-200 group">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-black text-sm flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">{lr.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{lr.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning Callout */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertOctagon className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Sanksi Pelanggaran</span>
              </div>
              <p className="text-xs text-rose-800 font-semibold leading-relaxed">
                Setiap pelanggaran terhadap peraturan dan larangan di atas akan ditindaklanjuti secara tegas oleh pengurus asrama dan dapat dilaporkan ke instansi Pemerintah Provinsi Jambi yang berwenang.
              </p>
            </div>
          </section>

        </div>

      </main>

      {/* Footer dari Halaman Utama */}
      <footer className="bg-slate-50 pt-24 pb-12 px-6 border-t border-slate-100">
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
                    className="text-primary-600 transition-colors"
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
                className="hover:text-primary-600 transition-colors"
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
