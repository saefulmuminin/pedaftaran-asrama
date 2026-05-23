"use client";

import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Pin, Megaphone, Users, Loader2 } from "lucide-react";
import { getAllKegiatan } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import type { Kegiatan, KategoriKegiatan } from "@/types";

const KATEGORI_META: Record<KategoriKegiatan, { label: string; bg: string; text: string; Icon: React.ElementType }> = {
  komunitas: { label: "Komunitas", bg: "bg-sky-50", text: "text-sky-700", Icon: Users },
  wajib: { label: "Wajib Hadir", bg: "bg-rose-50", text: "text-rose-700", Icon: Megaphone },
};

const MAX_ITEMS = 5;

export function KegiatanMahasiswaWidget() {
  const [data, setData] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllKegiatan()
      .then((list) => {
        // Filter:
        //   1. Hanya kategori yang dikenal (skip data lama "laporan")
        //   2. Belum lewat lebih dari 7 hari
        //   3. Max 5 terbaru
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filtered = list
          .filter((k) => k.kategori in KATEGORI_META)
          .filter((k) => k.tanggalMulai.toMillis() >= cutoff)
          .slice(0, MAX_ITEMS);
        setData(filtered);
      })
      .catch((err) => console.warn("Gagal load kegiatan:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6 border-none shadow-sm rounded-[2.5rem] bg-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
          <span className="text-sm font-bold text-slate-500">Memuat kegiatan...</span>
        </div>
      </Card>
    );
  }

  if (data.length === 0) return null;

  return (
    <Card className="p-6 md:p-7 border-none shadow-sm rounded-[2.5rem] bg-white">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Kegiatan Asrama</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {data.length} kegiatan terbaru
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((k) => {
          const meta = KATEGORI_META[k.kategori];
          const Icon = meta.Icon;
          return (
            <div
              key={k.id}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-primary-50/30 transition"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">{k.judul}</h3>
                  {k.kategori === "wajib" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shrink-0">
                      <Pin className="w-2.5 h-2.5" />
                      Wajib
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-2 leading-relaxed">
                  {k.deskripsi}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {k.tanggalMulai.toDate().toLocaleString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  {k.lokasi && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {k.lokasi}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
