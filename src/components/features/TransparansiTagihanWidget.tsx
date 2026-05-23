"use client";

import React, { useEffect, useState } from "react";
import { Wallet, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { getAllTagihan, getCurrentPeriode, formatPeriode } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import type { Tagihan } from "@/types";

type PenghuniStatus = "lunas" | "sebagian" | "belum" | "pending";

interface PenghuniRow {
  penghuniId: string;
  namaLengkap: string;
  nomorKamar: string;
  total: number;
  lunas: number;
  pending: number;
  unpaid: number;
  status: PenghuniStatus;
}

const STATUS_META: Record<PenghuniStatus, { label: string; bg: string; text: string; ring: string; Icon: React.ElementType }> = {
  lunas:    { label: "Lunas",        bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", Icon: CheckCircle },
  sebagian: { label: "Sebagian",     bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   Icon: AlertTriangle },
  pending:  { label: "Diproses",     bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     Icon: Clock },
  belum:    { label: "Belum Bayar",  bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    Icon: AlertTriangle },
};

export function TransparansiTagihanWidget() {
  const [rows, setRows] = useState<PenghuniRow[]>([]);
  const [loading, setLoading] = useState(true);
  const periode = getCurrentPeriode();

  useEffect(() => {
    getAllTagihan(periode)
      .then((list) => {
        console.log("[Transparansi] Tagihan periode", periode, ":", list.length, "item");
        const byPenghuni = new Map<string, PenghuniRow>();
        for (const t of list as Tagihan[]) {
          const existing = byPenghuni.get(t.penghuniId);
          if (existing) {
            existing.total++;
            if (t.status === "lunas") existing.lunas++;
            else if (t.status === "pending") existing.pending++;
            else existing.unpaid++;
          } else {
            byPenghuni.set(t.penghuniId, {
              penghuniId: t.penghuniId,
              namaLengkap: t.namaLengkap,
              nomorKamar: t.nomorKamar,
              total: 1,
              lunas: t.status === "lunas" ? 1 : 0,
              pending: t.status === "pending" ? 1 : 0,
              unpaid: t.status !== "lunas" && t.status !== "pending" ? 1 : 0,
              status: "belum",
            });
          }
        }

        // Set status agregat
        const arr = Array.from(byPenghuni.values()).map((r) => {
          let status: PenghuniStatus = "belum";
          if (r.lunas === r.total) status = "lunas";
          else if (r.lunas > 0) status = "sebagian";
          else if (r.pending > 0) status = "pending";
          return { ...r, status };
        });

        // Sort: belum bayar dulu (alasan: peer reminder), lalu sebagian, lalu pending, lalu lunas
        const order: Record<PenghuniStatus, number> = { belum: 0, sebagian: 1, pending: 2, lunas: 3 };
        arr.sort((a, b) => {
          if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
          return a.namaLengkap.localeCompare(b.namaLengkap);
        });

        setRows(arr);
      })
      .catch((err) => console.error("[Transparansi] Gagal load tagihan:", err))
      .finally(() => setLoading(false));
  }, [periode]);

  if (loading) {
    return (
      <Card className="p-6 border-none shadow-sm rounded-[2.5rem] bg-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
          <span className="text-sm font-bold text-slate-500">Memuat data pembayaran...</span>
        </div>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="p-6 md:p-7 border-none shadow-sm rounded-[2.5rem] bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Transparansi Iuran</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Periode {formatPeriode(periode)}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-500 font-medium text-center py-8">
          Belum ada tagihan untuk periode ini.
        </p>
        <p className="text-[10px] text-slate-400 text-center">
          Admin belum generate iuran untuk bulan ini.
        </p>
      </Card>
    );
  }

  const totalPenghuni = rows.length;
  const lunasCount = rows.filter((r) => r.status === "lunas").length;
  const progress = Math.round((lunasCount / totalPenghuni) * 100);

  return (
    <Card className="p-6 md:p-7 border-none shadow-sm rounded-[2.5rem] bg-white">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Transparansi Iuran</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Periode {formatPeriode(periode)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lunas</p>
          <p className="text-xl font-black text-emerald-600">
            {lunasCount}/{totalPenghuni}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] font-bold text-slate-500 mt-2 text-center">
          {progress}% penghuni sudah lunas
        </p>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
        {rows.map((r) => {
          const meta = STATUS_META[r.status];
          const Icon = meta.Icon;
          return (
            <div
              key={r.penghuniId}
              className={`flex items-center gap-3 p-3 rounded-2xl ${meta.bg} ring-1 ${meta.ring} transition`}
            >
              <div className={`w-8 h-8 bg-white rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${meta.text}`}>
                {r.namaLengkap.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{r.namaLengkap}</p>
                <p className="text-[10px] font-bold text-slate-500">
                  Kamar {r.nomorKamar} · {r.total} tagihan
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text} shrink-0`}>
                <Icon className="w-3 h-3" />
                {r.status === "sebagian" ? `${r.lunas}/${r.total}` : meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 font-medium text-center mt-4 pt-3 border-t border-slate-100">
        Halaman ini ditampilkan untuk transparansi pembayaran iuran asrama.
      </p>
    </Card>
  );
}
