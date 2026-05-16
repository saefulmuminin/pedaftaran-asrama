"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Eye, Download } from "lucide-react";
import { getAllPendaftaran } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, cn } from "@/lib/utils";
import type { Pendaftaran } from "@/types";

const statusOpts: { value: string; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  { value: "submitted", label: "Menunggu Verifikasi" },
  { value: "diverifikasi", label: "Sedang Diverifikasi" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
  { value: "draft", label: "Draft" },
];

export default function PendaftarPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "semua";

  const [data, setData] = useState<Pendaftaran[]>([]);
  const [filtered, setFiltered] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllPendaftaran();
    setData(all);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = data;
    if (statusFilter !== "semua") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.namaLengkap.toLowerCase().includes(q) ||
          p.nim?.toLowerCase().includes(q) ||
          p.universitas?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [data, search, statusFilter]);

  const exportCSV = () => {
    const header = ["Nama", "NIM", "Universitas", "Jurusan", "Status", "Tanggal Daftar"];
    const rows = filtered.map((p) => [
      p.namaLengkap, p.nim, p.universitas, p.jurusan, p.status,
      new Date(p.createdAt.seconds * 1000).toLocaleDateString("id-ID"),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data_pendaftar.csv";
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Pendaftar</h1>
          <p className="text-slate-500 font-medium mt-1">
            Ditemukan <span className="text-primary-600 font-bold">{filtered.length}</span> pendaftar dari total sistem
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="rounded-2xl font-bold bg-white shadow-sm border-slate-200" icon={<Download className="w-5 h-5" />} onClick={exportCSV}>
            Export Data
          </Button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <Card className="xl:col-span-3 p-2 bg-white/80 backdrop-blur-md border-none shadow-premium rounded-[2rem]">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIM, atau universitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-[1.8rem] border-none text-base font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-0 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 p-2 w-full md:w-auto">
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 min-w-[200px]">
                <Filter className="w-4 h-4 text-primary-600 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-slate-700 focus:outline-none appearance-none"
                >
                  {statusOpts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats side info */}
        <div className="flex xl:flex-col gap-3 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          {statusOpts.slice(0, 4).map((o) => {
            const count = o.value === "semua" ? data.length : data.filter((p) => p.status === o.value).length;
            const active = statusFilter === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setStatusFilter(o.value)}
                className={cn(
                  "flex items-center justify-between gap-4 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm border border-transparent min-w-[180px] xl:w-full",
                  active 
                    ? "bg-primary-600 text-white shadow-premium" 
                    : "bg-white text-slate-500 hover:bg-slate-50 border-slate-100"
                )}
              >
                {o.label.split(" ").slice(-1)[0]}
                <span className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-black",
                  active ? "bg-white/20 text-white" : "bg-primary-50 text-primary-600"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-none shadow-premium bg-white/50 backdrop-blur-md rounded-[2.5rem]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin shadow-sm" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 px-8">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Tidak Ada Data Ditemukan</h3>
            <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
              Coba sesuaikan kata kunci pencarian atau filter status yang Anda gunakan.
            </p>
            <Button variant="ghost" onClick={() => {setSearch(""); setStatusFilter("semua");}} className="mt-8 font-bold">
              Reset Pencarian
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5">Identitas Mahasiswa</th>
                  <th className="px-6 py-5">Institusi & Jurusan</th>
                  <th className="px-6 py-5">Asal Daerah</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-primary-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-black text-primary-700 shadow-sm shrink-0">
                          {p.namaLengkap.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors truncate">{p.namaLengkap}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-slate-700 leading-tight">{p.universitas}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{p.jurusan}</p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-slate-600 text-[11px] uppercase tracking-wide bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                        {p.kabupatenAsal}
                      </p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link href={`/admin/pendaftar/${p.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold px-5 border-slate-200 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all shadow-sm">
                          Detail <Eye className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
