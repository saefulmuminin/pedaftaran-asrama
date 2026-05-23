"use client";

import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Shield,
  FileText,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Star,
  Wifi,
  Menu,
  X,
  Users,
  User,
  Home,
  Bed,
  Bath,
  Utensils,
  Car,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    icon: FileText,
    title: "Pendaftaran Online",
    desc: "Daftar kapan saja dan di mana saja tanpa perlu datang langsung ke lokasi.",
    color: "bg-primary-50 text-primary-600",
  },
  {
    icon: Clock,
    title: "Proses Cepat",
    desc: "Status pendaftaran dapat dipantau secara real-time melalui sistem.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    title: "Transparan",
    desc: "Proses seleksi dilakukan secara transparan dan terstruktur.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: CheckCircle,
    title: "Verifikasi Mudah",
    desc: "Upload dokumen secara digital, tidak perlu fotokopi fisik.",
    color: "bg-orange-50 text-orange-600",
  },
];

const fasilitasDetail = [
  {
    id: "kamar",
    icon: Bed,
    label: "Kamar Nyaman",
    desc: "Kamar tidur bersih & nyaman dilengkapi tempat tidur, lemari, meja belajar, dan kipas angin untuk suasana belajar kondusif.",
    mainImage: "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.52.jpeg",
    images: [
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.52.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.54.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.53.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.54 (2).jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.55.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.58.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.59.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.59 (1).jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.59 (2).jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.54.00.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.54.00 (1).jpeg",
    ],
    features: [
      "Kasur & Bantal",
      "Lemari Pakaian",
      "Meja & Kursi Belajar",
      "Ventilasi Bagus",
    ],
  },
  {
    id: "kamar-mandi",
    icon: Bath,
    label: "Kamar Mandi",
    desc: "Kamar mandi bersih dengan lantai & dinding keramik rapi, ventilasi udara yang baik, dan pasokan air bersih melimpah.",
    mainImage: "/fasilitas/kamar_mandi_asrama.png",
    images: ["/fasilitas/kamar_mandi_asrama.png"],
    features: [
      "Lantai Keramik",
      "Ember & Gayung Baru",
      "Sanitasi Terjaga",
      "Air Lancar",
    ],
  },
  {
    id: "dapur",
    icon: Utensils,
    label: "Dapur Bersama",
    desc: "Dapur bersama yang luas dengan kompor gas, wastafel cuci piring, dan peralatan masak lengkap untuk kebutuhan sehari-hari.",
    mainImage: "/fasilitas/dapur_asrama.png",
    images: ["/fasilitas/dapur_asrama.png"],
    features: [
      "Kompor Gas",
      "Wastafel Bersih",
      "Peralatan Memasak",
      "Tabung LPG",
    ],
  },
  {
    id: "parkiran",
    icon: Car,
    label: "Parkiran Motor",
    desc: "Area parkir kendaraan roda dua yang terlindungi kanopi kokoh, aman, dan tertata rapi di pekarangan depan asrama.",
    mainImage: "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.51.jpeg",
    images: ["/fasilitas/WhatsApp Image 2026-05-13 at 14.53.51.jpeg"],
    features: [
      "Kanopi Pelindung",
      "Kapasitas Luas",
      "Aman & Terpantau",
      "Gerbang Utama",
    ],
  },
  {
    id: "kebersihan",
    icon: Sparkles,
    label: "Kebersihan Rutin",
    desc: "Kebersihan koridor, ruang komunal, dan area bersama yang selalu dijaga secara berkala untuk lingkungan sehat.",
    mainImage: "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.50.jpeg",
    images: [
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.53.50.jpeg",
      "/fasilitas/WhatsApp Image 2026-05-13 at 14.54.00 (2).jpeg",
    ],
    features: [
      "Koridor Bersih",
      "Lantai Mengkilap",
      "Bebas Sampah",
      "Lingkungan Asri",
    ],
  },
  {
    id: "wifi",
    icon: Wifi,
    label: "High-Speed WiFi",
    desc: "Jaringan internet berkecepatan tinggi terpasang merata di setiap sudut area untuk menunjang aktivitas belajar online.",
    mainImage: "/fasilitas/wifi_asrama.png",
    images: ["/fasilitas/wifi_asrama.png"],
    features: [
      "Koneksi Unlimited",
      "Router Terbaru",
      "Stabil untuk Kuliah",
      "Menjangkau Kamar",
    ],
  },
  {
    id: "cctv",
    icon: Eye,
    label: "Keamanan CCTV",
    desc: "Dilengkapi kamera CCTV di berbagai titik strategis luar dan dalam asrama untuk menjamin keamanan optimal 24/7.",
    mainImage: "/fasilitas/cctv_asrama.png",
    images: ["/fasilitas/cctv_asrama.png"],
    features: [
      "Pantauan 24/7",
      "Banyak Titik Kamera",
      "Area Luar & Dalam",
      "Aman & Nyaman",
    ],
  },
];

const steps = [
  {
    num: "01",
    title: "Buat Akun",
    desc: "Daftar dengan email aktif dan buat password untuk akun Anda.",
  },
  {
    num: "02",
    title: "Isi Formulir",
    desc: "Lengkapi data diri, data akademik, dan unggah dokumen yang diperlukan.",
  },
  {
    num: "03",
    title: "Kirim & Tunggu",
    desc: "Submit pendaftaran dan pantau status verifikasi secara online.",
  },
  {
    num: "04",
    title: "Diterima!",
    desc: "Terima pemberitahuan resmi dan informasi nomor kamar yang ditentukan.",
  },
];

const testimonials = [
  {
    name: "Rizki A.",
    univ: "Universitas Indonesia",
    text: "Proses daftarnya mudah banget, tinggal upload dokumen online. Gak perlu antri!",
  },
  {
    name: "Sari W.",
    univ: "UPN Veteran Jakarta",
    text: "Statusnya bisa dipantau langsung, jadi tenang nunggu hasilnya.",
  },
  {
    name: "Fajar M.",
    univ: "Universitas Trisakti",
    text: "Fasilitas asrama bagus, lokasinya strategis. Rekomen buat anak Jambi yang kuliah di Jakarta!",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [activeFacility, setActiveFacility] = useState(fasilitasDetail[0].id);
  const [activeImage, setActiveImage] = useState(fasilitasDetail[0].mainImage);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const dashboardHref =
    userProfile?.role === "admin" ? "/admin/dashboard" : "/mahasiswa/dashboard";

  const currentFacility =
    fasilitasDetail.find((f) => f.id === activeFacility) ?? fasilitasDetail[0];

  const handleFacilityChange = (id: string) => {
    const next = fasilitasDetail.find((f) => f.id === id);
    if (!next) return;
    setActiveFacility(id);
    setActiveImage(next.mainImage);
  };

  const navigateLightbox = (dir: 1 | -1) => {
    if (!lightbox) return;
    const idx = currentFacility.images.indexOf(lightbox);
    if (idx === -1) return;
    const nextIdx =
      (idx + dir + currentFacility.images.length) %
      currentFacility.images.length;
    setLightbox(currentFacility.images[nextIdx]);
  };

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
    <div className="min-h-screen bg-white selection:bg-primary-100 selection:text-primary-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <a
              href="#fitur"
              className="hover:text-primary-600 transition-colors"
            >
              Fitur
            </a>
            <a
              href="#cara-daftar"
              className="hover:text-primary-600 transition-colors"
            >
              Panduan
            </a>
            <a
              href="#fasilitas"
              className="hover:text-primary-600 transition-colors"
            >
              Fasilitas
            </a>
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
            <a
              href="#fitur"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fitur
            </a>
            <a
              href="#cara-daftar"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Panduan
            </a>
            <a
              href="#fasilitas"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fasilitas
            </a>
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

      {/* Hero */}
      <section className="relative pt-10 pb-20 md:pt-16 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-bottom duration-1000">
              <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] text-slate-900 tracking-tight">
                Hunian Premium <br />
                Untuk <span className="text-primary-600">Mahasiswa</span> <br />
                Provinsi Jambi
              </h1>

              <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Dapatkan pengalaman tinggal yang nyaman, aman, dan kondusif di
                jantung Jakarta. Sistem pendaftaran transparan, digital, dan
                terintegrasi.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
                <Link
                  href="/daftar"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-primary-600 text-white font-extrabold rounded-3xl hover:bg-primary-700 transition-all shadow-premium hover:scale-[1.05] active:scale-[0.98] text-lg"
                >
                  Mulai Daftar <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 border-2 border-slate-100 text-slate-700 font-extrabold rounded-3xl hover:bg-slate-50 hover:border-slate-200 transition-all text-lg"
                >
                  Masuk ke Akun
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="pt-10 flex flex-wrap justify-center lg:justify-start gap-8 border-t border-slate-100">
                {[
                  { num: "100+", label: "Kapasitas" },
                  { num: "24/7", label: "Security" },
                  { num: "High", label: "Speed WiFi" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      {s.num}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative w-full max-w-2xl lg:max-w-none animate-in fade-in zoom-in-95 duration-1000 delay-300">
              {/* Image Frame */}
              <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
                <img
                  src="/asrama.jpeg"
                  alt="Modern Dormitory"
                  className="w-full h-full object-cover aspect-[4/5] lg:aspect-square"
                />
              </div>

              {/* Decorative background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-50 rounded-full blur-3xl -z-10 opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="py-32 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-primary-600 font-extrabold text-xs uppercase tracking-[0.2em]">
              Keunggulan Kami
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 tracking-tight">
              Kenapa Harus Daftar Online?
            </h2>
            <div className="w-20 h-1.5 bg-primary-600 mx-auto mt-6 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FileText,
                title: "Pendaftaran Online",
                desc: "Daftar kapan saja dan di mana saja tanpa perlu datang langsung ke lokasi fisik.",
                color: "bg-primary-100 text-primary-600",
              },
              {
                icon: Clock,
                title: "Proses Cepat",
                desc: "Status pendaftaran dapat dipantau secara real-time melalui dashboard mahasiswa.",
                color: "bg-sky-100 text-sky-600",
              },
              {
                icon: Shield,
                title: "Sistem Transparan",
                desc: "Seluruh proses seleksi dilakukan secara transparan dan terstruktur sesuai kuota.",
                color: "bg-emerald-100 text-emerald-600",
              },
              {
                icon: CheckCircle,
                title: "Verifikasi Mudah",
                desc: "Cukup unggah dokumen digital secara langsung, tidak memerlukan berkas fisik.",
                color: "bg-amber-100 text-amber-600",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-premium hover:-translate-y-2 transition-all duration-300 group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${f.color}`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cara Daftar */}
      <section id="cara-daftar" className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-primary-600 font-extrabold text-xs uppercase tracking-[0.2em]">
                Panduan
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 tracking-tight mb-8">
                Cara Mendaftar di Sistem Kami
              </h2>
              <p className="text-lg text-slate-500 font-medium mb-10">
                Hanya perlu 4 langkah mudah untuk mendapatkan hunian yang nyaman
                di Jakarta.
              </p>

              <div className="space-y-6">
                {[
                  {
                    num: "01",
                    title: "Buat Akun",
                    desc: "Daftar dengan email aktif dan buat password untuk akses sistem.",
                  },
                  {
                    num: "02",
                    title: "Lengkapi Data",
                    desc: "Isi formulir data diri, akademik, dan unggah dokumen persyaratan.",
                  },
                  {
                    num: "03",
                    title: "Verifikasi",
                    desc: "Tunggu admin memverifikasi data Anda. Pantau status di dashboard.",
                  },
                  {
                    num: "04",
                    title: "Diterima!",
                    desc: "Dapatkan pemberitahuan resmi dan konfirmasi nomor kamar Anda.",
                  },
                ].map((step) => (
                  <div key={step.num} className="flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      {step.num}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 relative flex justify-center items-center mt-16 lg:mt-0 px-4 md:px-0">
              <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-300 w-full max-w-[600px]">
                <img
                  src="/app_combined_mockup.png"
                  alt="Asrama Jambi Multi-Platform Mockup"
                  className="w-full h-auto drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
              {/* Decorative background circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-50 rounded-full blur-[80px] md:blur-[120px] -z-10 opacity-30 md:opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* Fasilitas */}
      <section
        id="fasilitas"
        className="py-20 md:py-32 px-6 bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] mx-4 md:mx-10 mb-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-primary-400 font-extrabold text-xs uppercase tracking-[0.2em]">
              Amenities
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight">
              Fasilitas Lengkap & Nyaman
            </h2>
            <p className="text-slate-400 font-medium mt-5 max-w-xl mx-auto">
              Jelajahi setiap fasilitas asrama melalui galeri foto interaktif di
              bawah ini.
            </p>
          </div>

          {/* Tab navigation */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
            {fasilitasDetail.map((f) => {
              const Icon = f.icon;
              const isActive = f.id === activeFacility;
              return (
                <button
                  key={f.id}
                  onClick={() => handleFacilityChange(f.id)}
                  className={`inline-flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 border ${
                    isActive
                      ? "bg-primary-600 text-white border-primary-500 shadow-premium scale-[1.02]"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Active facility content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-10 items-start">
            <div className="lg:col-span-3 space-y-4">
              <div
                className="relative group rounded-[2rem] overflow-hidden border border-white/10 bg-slate-800 cursor-zoom-in"
                onClick={() => setLightbox(activeImage)}
              >
                <img
                  src={activeImage}
                  alt={currentFacility.label}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  type="button"
                  className="absolute top-4 right-4 p-2.5 rounded-2xl bg-slate-900/70 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox(activeImage);
                  }}
                  aria-label="Perbesar foto"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {currentFacility.images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
                  {currentFacility.images.map((img) => {
                    const isActiveImg = img === activeImage;
                    return (
                      <button
                        key={img}
                        onClick={() => setActiveImage(img)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          isActiveImg
                            ? "border-primary-500 scale-[1.03] shadow-premium"
                            : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                        }`}
                        aria-label="Ganti foto"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-primary-600/20 rounded-2xl flex items-center justify-center">
                  <currentFacility.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  {currentFacility.label}
                </h3>
              </div>

              <p className="text-slate-300 font-medium leading-relaxed mb-6">
                {currentFacility.desc}
              </p>

              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-3">
                Highlight
              </p>
              <ul className="space-y-2.5">
                {currentFacility.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm font-bold text-slate-200"
                  >
                    <CheckCircle className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-bold text-slate-400">
                <span className="text-primary-400">
                  {currentFacility.images.length}
                </span>{" "}
                foto tersedia untuk fasilitas ini
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 p-3 rounded-2xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {currentFacility.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(-1);
                }}
                className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(1);
                }}
                className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition"
                aria-label="Foto berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <img
            src={lightbox}
            alt={currentFacility.label}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-bold">
            {currentFacility.label}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-32 px-6 bg-white relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-100 rounded-full blur-[120px] opacity-50 animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-100 rounded-full blur-[120px] opacity-50 animate-pulse delay-700" />
        </div>

        <div className="max-w-6xl mx-auto relative px-4 md:px-0">
          <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-24 text-center relative overflow-hidden shadow-2xl border border-slate-800">
            {/* Inner Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
                Siap Memulai <br />
                <span className="bg-gradient-to-r from-primary-400 to-rose-400 bg-clip-text text-transparent">
                  Masa Depanmu?
                </span>
              </h2>

              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                Bergabunglah dengan ratusan mahasiswa Jambi lainnya di Jakarta.
                Amankan hunian nyamanmu sebelum pendaftaran ditutup!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6">
                <Link
                  href="/daftar"
                  className="group relative px-8 md:px-12 py-5 md:py-6 bg-primary-600 text-white font-black rounded-2xl md:rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-15px_rgba(212,14,25,0.4)] w-full sm:w-auto text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="flex items-center justify-center gap-3 text-lg">
                    Daftar Sekarang{" "}
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                <Link
                  href="/login"
                  className="px-8 md:px-12 py-5 md:py-6 bg-white/5 backdrop-blur-md text-white font-black rounded-2xl md:rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all text-lg w-full sm:w-auto text-center"
                >
                  Masuk ke Akun
                </Link>
              </div>

              <div className="pt-12 flex flex-wrap justify-center gap-8 opacity-40">
                <div className="flex items-center gap-2 grayscale brightness-200">
                  <Shield className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Secure Auth
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale brightness-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Instant Verify
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale brightness-200">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    24/7 Support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                  <a
                    href="#fitur"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Informasi Fitur
                  </a>
                </li>
                <li>
                  <a
                    href="#fasilitas"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Fasilitas Umum
                  </a>
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
                href="/tata-tertib"
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
