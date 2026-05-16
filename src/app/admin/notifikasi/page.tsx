"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Send, Users, User, Info, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotifikasi } from "@/lib/firestore";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

const schema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  pesan: z.string().min(10, "Pesan minimal 10 karakter"),
  tipe: z.enum(["info", "success", "warning", "error"]),
  target: z.enum(["semua", "spesifik"]),
  userId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NotifikasiAdminPage() {
  const { success, error } = useToast();
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipe: "info", target: "semua" },
  });

  const target = watch("target");

  const loadUsers = async () => {
    if (users.length > 0) return;
    setLoadingUsers(true);
    const snap = await getDocs(collection(db, "users"));
    const data = snap.docs.map((d) => d.data() as UserProfile).filter((u) => u.role === "mahasiswa");
    setUsers(data);
    setLoadingUsers(false);
  };

  React.useEffect(() => {
    if (target === "spesifik") loadUsers();
  }, [target]);

  const onSubmit = async (data: FormData) => {
    setSending(true);
    try {
      const notifData = {
        judul: data.judul,
        pesan: data.pesan,
        tipe: data.tipe,
        dibaca: false,
        createdAt: Timestamp.now(),
      };

      if (data.target === "semua") {
        // Send to all mahasiswa
        if (users.length === 0) await loadUsers();
        const allUsers = await getDocs(collection(db, "users"));
        const mahasiswa = allUsers.docs.filter((d) => d.data().role === "mahasiswa");
        await Promise.all(mahasiswa.map((u) => createNotifikasi({ ...notifData, userId: u.id })));
        success(`Notifikasi dikirim ke ${mahasiswa.length} mahasiswa!`);
      } else {
        if (!data.userId) { error("Pilih pengguna terlebih dahulu"); setSending(false); return; }
        await createNotifikasi({ ...notifData, userId: data.userId });
        success("Notifikasi berhasil dikirim!");
      }
      reset();
    } catch {
      error("Gagal mengirim notifikasi.");
    } finally {
      setSending(false);
    }
  };

  const tipeStyle: Record<string, string> = {
    info: "bg-blue-50 border-blue-100 text-blue-700",
    success: "bg-primary-50 border-primary-100 text-primary-700",
    warning: "bg-amber-50 border-amber-100 text-amber-700",
    error: "bg-red-50 border-red-100 text-red-700",
  };

  const tipe = watch("tipe");

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Kirim Notifikasi</h1>
          <p className="text-slate-500 font-medium">Berikan informasi penting kepada mahasiswa secara real-time.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-[13px] font-bold text-slate-600">
          <Bell className="w-4.5 h-4.5 text-primary-500" />
          Broadcast System Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 md:p-10 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[3rem]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Target Selection */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Target Penerima</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className={cn(
                    "relative flex flex-col gap-4 p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-500 group",
                    target === "semua" 
                      ? "border-primary-500 bg-primary-50/30 shadow-xl shadow-primary-500/5 ring-8 ring-primary-100/30" 
                      : "border-slate-100 bg-white hover:border-primary-200 hover:shadow-lg"
                  )}>
                    <input type="radio" value="semua" {...register("target")} className="sr-only" />
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm group-hover:scale-110", target === "semua" ? "bg-primary-600 text-white rotate-3" : "bg-slate-50 text-slate-400")}>
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 tracking-tight">Semua Mahasiswa</p>
                      <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">Kirim pengumuman broadcast ke seluruh akun terdaftar.</p>
                    </div>
                    {target === "semua" && <div className="absolute top-6 right-6 w-3 h-3 bg-primary-600 rounded-full animate-pulse" />}
                  </label>

                  <label className={cn(
                    "relative flex flex-col gap-4 p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-500 group",
                    target === "spesifik" 
                      ? "border-primary-500 bg-primary-50/30 shadow-xl shadow-primary-500/5 ring-8 ring-primary-100/30" 
                      : "border-slate-100 bg-white hover:border-primary-200 hover:shadow-lg"
                  )}>
                    <input type="radio" value="spesifik" {...register("target")} className="sr-only" />
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm group-hover:scale-110", target === "spesifik" ? "bg-primary-600 text-white -rotate-3" : "bg-slate-50 text-slate-400")}>
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 tracking-tight">Mahasiswa Spesifik</p>
                      <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">Tujukan pesan hanya untuk individu tertentu.</p>
                    </div>
                    {target === "spesifik" && <div className="absolute top-6 right-6 w-3 h-3 bg-primary-600 rounded-full animate-pulse" />}
                  </label>
                </div>

                {target === "spesifik" && (
                  <div className="animate-in fade-in slide-in-top duration-500 pt-2">
                    {loadingUsers ? (
                      <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <div className="w-5 h-5 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat daftar pengguna...</p>
                      </div>
                    ) : (
                      <Select
                        label="Pilih Penerima Mahasiswa"
                        required
                        options={users.map((u) => ({ value: u.uid, label: `${u.displayName} — ${u.email}` }))}
                        {...register("userId")}
                        className="rounded-2xl"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Konten Pesan</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Select
                    label="Kategori Pesan"
                    required
                    options={[
                      { value: "info", label: "ℹ️ Informasi Umum" },
                      { value: "success", label: "✅ Berhasil / Diterima" },
                      { value: "warning", label: "⚠️ Peringatan Penting" },
                      { value: "error", label: "❌ Masalah / Penolakan" },
                    ]}
                    {...register("tipe")}
                    className="rounded-2xl"
                  />
                  <Input
                    label="Judul Notifikasi"
                    placeholder="Contoh: Hasil Verifikasi Pendaftaran"
                    required
                    error={errors.judul?.message}
                    {...register("judul")}
                    className="rounded-2xl"
                  />
                </div>

                <TextArea
                  label="Isi Pesan Lengkap"
                  placeholder="Tuliskan detail informasi yang ingin disampaikan..."
                  required
                  rows={5}
                  error={errors.pesan?.message}
                  {...register("pesan")}
                  className="rounded-[1.5rem]"
                />
              </div>

              <Button type="submit" loading={sending} icon={<Send className="w-5 h-5" />} className="w-full rounded-2xl font-bold py-8 shadow-premium text-lg" size="lg">
                Kirim Notifikasi Sekarang
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar Column: Preview & Guide */}
        <div className="space-y-8">
          {/* Real-time Preview */}
          <Card className="p-8 border-none shadow-premium bg-slate-900 text-white relative overflow-hidden group min-h-[300px]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Live Preview</p>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-400" />
                </div>
              </div>

              {watch("judul") || watch("pesan") ? (
                <div className={cn("p-6 rounded-[2rem] border transition-all duration-500", 
                  tipe === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-100",
                  tipe === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",
                  tipe === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-100",
                  tipe === "error" && "bg-rose-500/10 border-rose-500/20 text-rose-100",
                )}>
                  <h4 className="text-base font-black tracking-tight mb-2">{watch("judul") || "Judul Notifikasi"}</h4>
                  <p className="text-xs font-medium leading-relaxed opacity-80">{watch("pesan") || "Isi pesan akan muncul di sini..."}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <Bell className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Belum ada input</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Status Pengiriman</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-white/60">Sistem siap mengirim...</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Guide Card */}
          <Card className="p-8 border-none bg-white shadow-premium rounded-[2.5rem] space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Panduan Pengiriman</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { title: "Real-time Update", desc: "Notifikasi akan langsung muncul di dashboard mahasiswa." },
                { title: "Target Audience", desc: "Pilih broadcast atau target individu dengan tepat." },
                { title: "Validation", desc: "Pastikan pesan sudah benar, data tidak dapat diubah." },
                { title: "Visual Context", desc: "Gunakan kategori yang sesuai untuk membedakan urgensi." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1 h-auto bg-primary-100 rounded-full shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">{item.title}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
