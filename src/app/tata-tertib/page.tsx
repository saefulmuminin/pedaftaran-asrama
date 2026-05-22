"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Ban, ArrowLeft, Lock, Loader2 } from "lucide-react";
import { getAllTataTertib } from "@/lib/firestore";
import type { TataTertibItem } from "@/types";

export default function TataTertibPage() {
  const [items, setItems] = useState<TataTertibItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTataTertib()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const kewajiban = items.filter((i) => i.kategori === "kewajiban");
  const larangan = items.filter((i) => i.kategori === "larangan");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Beranda
          </Link>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
            <span className="text-sm font-extrabold text-slate-900 tracking-tight hidden sm:block">
              Asrama Mahasiswa Jambi
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="inline-block text-primary-600 font-extrabold text-xs uppercase tracking-[0.2em]">
            Pedoman Penghuni
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Tata Tertib Asrama
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Setiap penghuni Asrama Mahasiswa Jambi Jakarta wajib membaca, memahami,
            dan mematuhi tata tertib berikut demi kenyamanan bersama.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
              Memuat tata tertib...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 text-center">
            <p className="text-amber-800 font-bold">
              Tata tertib belum diatur oleh administrator.
            </p>
            <p className="text-amber-700 text-sm font-medium mt-2">
              Silakan hubungi pengurus asrama untuk informasi lebih lanjut.
            </p>
          </div>
        ) : (
          <>
            {/* Kewajiban */}
            {kewajiban.length > 0 && (
              <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                      Bagian 1
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tight">Kewajiban Penghuni</h2>
                  </div>
                </div>
                <ol className="divide-y divide-slate-50">
                  {kewajiban.map((item, idx) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-4 px-8 py-5 hover:bg-emerald-50/40 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm group-hover:scale-105 transition-transform">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">
                          Pasal {String(idx + 1).padStart(2, "0")}
                        </p>
                        <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                          {item.teks}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Larangan */}
            {larangan.length > 0 && (
              <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Ban className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                      Bagian 2
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tight">Larangan</h2>
                  </div>
                </div>
                <ol className="divide-y divide-slate-50">
                  {larangan.map((item, idx) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-4 px-8 py-5 hover:bg-rose-50/40 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm group-hover:scale-105 transition-transform">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-0.5">
                          Larangan {String(idx + 1).padStart(2, "0")}
                        </p>
                        <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                          {item.teks}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Footer Note */}
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 md:p-8 flex gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-amber-900">Sanksi Pelanggaran</p>
                <p className="text-xs md:text-sm text-amber-800 font-medium leading-relaxed">
                  Pelanggaran terhadap tata tertib di atas dapat dikenakan sanksi berupa
                  teguran lisan, teguran tertulis, hingga pencabutan hak hunian sesuai
                  keputusan pengurus asrama.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} Asrama Mahasiswa Jambi Jakarta — Pemerintah Provinsi Jambi
        </div>
      </footer>
    </div>
  );
}
