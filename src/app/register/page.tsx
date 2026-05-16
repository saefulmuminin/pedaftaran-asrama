"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Mail, Lock, User, Eye, EyeOff, Phone, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateUserProfile } from "@/lib/firestore";

const schema = z
  .object({
    namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    noHp: z.string().min(10, "Nomor HP tidak valid").max(15),
    password: z.string().min(8, "Password minimal 8 karakter"),
    konfirmasi: z.string(),
  })
  .refine((d) => d.password === d.konfirmasi, {
    message: "Password tidak sama",
    path: ["konfirmasi"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: authRegister, userProfile, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Redirect ke dashboard kalau sudah login
  useEffect(() => {
    if (!authLoading && userProfile) {
      router.replace(userProfile.role === "admin" ? "/admin/dashboard" : "/mahasiswa/dashboard");
    }
  }, [authLoading, userProfile, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authRegister(data.email, data.password, data.namaLengkap);
      // Simpan noHp ke profil
      const { auth } = await import("@/lib/firebase");
      if (auth.currentUser) {
        await updateUserProfile(auth.currentUser.uid, { noHp: data.noHp });
      }
      success("Akun berhasil dibuat!");
      setDone(true);
      setTimeout(() => router.push("/mahasiswa/dashboard"), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        error("Email sudah terdaftar. Silakan login.");
      } else if (msg.includes("weak-password")) {
        error("Password terlalu lemah.");
      } else {
        error("Gagal membuat akun. Periksa koneksi internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-50/30 blur-3xl opacity-50" />
        <div className="relative text-center animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-primary-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-premium">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Akun Berhasil Dibuat!</h2>
          <p className="text-slate-500 font-medium text-lg">Selamat bergabung. Mengalihkan Anda ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Image */}
      <div className="hidden md:block w-1/2 relative bg-primary-600 overflow-hidden">
        <img 
          src="/register_sidebar_1778427686014.png" 
          alt="Student Community" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-transparent to-primary-900/40" />
        
        <div className="absolute bottom-20 left-20 right-20 space-y-6 text-white animate-in fade-in slide-in-bottom duration-1000 delay-500">
          <div className="w-20 h-1 bg-white rounded-full" />
          <h2 className="text-5xl font-black leading-tight tracking-tight">
            Temukan Komunitas <br /> Mahasiswa Jambi <br /> yang Suportif.
          </h2>
          <p className="text-xl text-primary-100 font-medium max-w-md">
            Asrama bukan sekadar tempat tinggal, tapi wadah untuk tumbuh bersama dan membangun masa depan.
          </p>
        </div>

        {/* Decorative dots */}
        <div className="absolute top-10 left-10 flex gap-2">
          {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-white/40 rounded-full" />)}
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-start md:justify-center p-8 md:p-16 lg:p-24 relative z-10 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-1000">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Daftar Sekarang</h1>
            <p className="text-slate-500 font-medium">Lengkapi data untuk bergabung dengan komunitas asrama.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Nama Lengkap"
                placeholder="Sesuai KTP"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.namaLengkap?.message}
                required
                {...register("namaLengkap")}
                className="rounded-2xl"
              />

              <Input
                label="Alamat Email"
                type="email"
                placeholder="nama@email.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                required
                {...register("email")}
                className="rounded-2xl"
              />

              <Input
                label="Nomor WhatsApp"
                type="tel"
                placeholder="08xxxxxxxxxx"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.noHp?.message}
                required
                {...register("noHp")}
                className="rounded-2xl"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  required
                  {...register("password")}
                  className="rounded-2xl"
                />
                <Input
                  label="Konfirmasi"
                  type={showPass ? "text" : "password"}
                  placeholder="Ulangi"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.konfirmasi?.message}
                  required
                  {...register("konfirmasi")}
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div className="bg-primary-50 rounded-2xl p-5 text-[10px] text-primary-700 border border-primary-100/50">
              <p className="font-black mb-2 uppercase tracking-[0.2em]">Persyaratan Utama:</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-bold uppercase tracking-widest opacity-80">
                <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-primary-600 rounded-full" /> Mahasiswa Jambi</span>
                <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-primary-600 rounded-full" /> Kuliah di Jakarta</span>
                <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-primary-600 rounded-full" /> Dokumen Lengkap</span>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-6 text-lg rounded-2xl shadow-xl hover:shadow-primary-600/20" size="lg">
              Buat Akun Sekarang
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-primary-600 font-black hover:underline decoration-2 underline-offset-4">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
