"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { getAllTamu } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import type { Tamu, TamuItem } from "@/types";

interface TamuTerbaruWidgetProps {
  /** Link "lihat semua" — disesuaikan per role. */
  href?: string;
  /** Max item yang ditampilkan. */
  limit?: number;
  /** Tampilkan tamu sampai N hari ke belakang. Default 2 hari. */
  daysBack?: number;
}

function isSameDay(ts: number): boolean {
  const today = new Date();
  const d = new Date(ts);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function TamuTerbaruWidget({
  href = "/mahasiswa/tamu",
  limit = 5,
  daysBack = 2,
}: TamuTerbaruWidgetProps) {
  const [data, setData] = useState<Tamu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    getAllTamu()
      .then((list) => {
        const filtered = list
          .filter((t) => t.waktuKedatangan.toMillis() >= cutoff)
          .slice(0, limit);
        setData(filtered);
      })
      .catch((err) => console.warn("Gagal load tamu:", err))
      .finally(() => setLoading(false));
  }, [limit, daysBack]);

  const todayCount = data.filter((t) => isSameDay(t.waktuKedatangan.toMillis())).length;

  if (loading) {
    return (
      <Card className="p-6 border-none shadow-sm rounded-[2.5rem] bg-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
          <span className="text-sm font-bold text-slate-500">Memuat tamu...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-7 border-none shadow-sm rounded-[2.5rem] bg-white">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Tamu Terbaru</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {todayCount > 0 ? `${todayCount} datang hari ini` : "Belum ada hari ini"}
            </p>
          </div>
        </div>
        <Link
          href={href}
          className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          Semua
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400 font-medium">Belum ada catatan tamu dalam {daysBack} hari terakhir.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {data.map((t) => {
            const tamuList: TamuItem[] = (t.tamus && t.tamus.length > 0)
              ? t.tamus
              : [{ nama: t.namaTamu, hubungan: t.hubungan, noHp: t.noHpTamu }];
            const first = tamuList[0];
            const moreCount = tamuList.length - 1;
            const isToday = isSameDay(t.waktuKedatangan.toMillis());
            return (
              <li
                key={t.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/30 transition"
              >
                <div className="relative w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center font-black text-sky-700 text-sm shrink-0">
                  {first.nama.charAt(0).toUpperCase()}
                  {moreCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      +{moreCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      {first.nama}
                      {moreCount > 0 && <span className="text-slate-500 font-bold"> +{moreCount}</span>}
                    </p>
                    {isToday && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {first.hubungan}
                    {t.untukPenghuni && (
                      <>
                        <span className="text-slate-400"> · untuk </span>
                        <span className="font-bold text-slate-700">{t.untukPenghuni}</span>
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3" />
                    {t.waktuKedatangan.toDate().toLocaleString("id-ID", {
                      day: "numeric", month: "short",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
