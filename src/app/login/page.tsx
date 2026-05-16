"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect ke dashboard kalau sudah login
  useEffect(() => {
    if (!authLoading && userProfile) {
      router.replace(userProfile.role === "admin" ? "/admin/dashboard" : "/mahasiswa/dashboard");
    }
  }, [authLoading, userProfile, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);

      // Ambil profil langsung setelah login
      const profile = await getUserProfile(cred.user.uid);

      success("Berhasil masuk!");

      if (profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/mahasiswa/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        error("Email atau password salah");
      } else if (msg.includes("too-many-requests")) {
        error("Terlalu banyak percobaan. Coba lagi nanti.");
      } else {
        error("Gagal masuk. Periksa koneksi internet Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-start md:justify-center p-8 md:p-16 lg:p-24 relative z-10 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-12 animate-in fade-in slide-in-bottom duration-1000">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Selamat Datang</h1>
            <p className="text-slate-500 font-medium">Masuk untuk mengelola pendaftaran asrama Anda.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="space-y-2">
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Masukkan password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-primary-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                required
                {...register("password")}
                className="rounded-2xl"
              />
              <div className="flex justify-end">
                <button type="button" className="text-xs font-bold text-primary-600 hover:underline">Lupa Password?</button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-6 text-lg rounded-2xl shadow-xl hover:shadow-primary-600/20" size="lg">
              Masuk Sekarang
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 font-medium">
            Belum memiliki akun?{" "}
            <Link href="/register" className="text-primary-600 font-black hover:underline decoration-2 underline-offset-4">
              Daftar Gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side: Image */}
      <div className="hidden md:block w-1/2 relative bg-primary-600 overflow-hidden">
        <img 
          src="/login_sidebar_1778427661235.png" 
          alt="Student Life" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-transparent to-primary-900/40" />
        
        <div className="absolute bottom-20 left-20 right-20 space-y-6 text-white animate-in fade-in slide-in-bottom duration-1000 delay-500">
          <div className="w-20 h-1 bg-white rounded-full" />
          <h2 className="text-5xl font-black leading-tight tracking-tight">
            Mulai Perjalanan <br /> Akademik Anda <br /> Bersama Kami.
          </h2>
          <p className="text-xl text-primary-100 font-medium max-w-md">
            Lingkungan belajar yang kondusif adalah kunci kesuksesan mahasiswa di Jakarta.
          </p>
        </div>

        {/* Decorative pattern */}
        <div className="absolute top-10 right-10 flex gap-2">
          {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-white/40 rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
