"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  User,
  BookOpen,
  MapPin,
  Phone,
  Lock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Calendar,
  Info,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { createUserProfile, createPendaftaran } from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

// ── Schemas per step ──────────────────────────────────────────────────────────

const biodataSchema = z.object({
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK hanya angka"),
  tempatLahir: z.string().min(2, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenisKelamin: z.enum(["L", "P"], { required_error: "Pilih jenis kelamin" }),
  agama: z.string().min(1, "Pilih agama"),
  golonganDarah: z.string().min(1, "Pilih golongan darah"),
});

const akademikSchema = z.object({
  nim: z.string().min(5, "NIM tidak valid"),
  universitas: z.string().min(3, "Nama universitas wajib diisi"),
  fakultas: z.string().min(2, "Nama fakultas wajib diisi"),
  jurusan: z.string().min(2, "Nama jurusan wajib diisi"),
  semester: z.coerce.number().min(1).max(14),
  ipk: z
    .string()
    .regex(/^\d(\.\d{1,2})?$/, "IPK tidak valid (contoh: 3.5)"),
});

const kontakSchema = z.object({
  email: z.string().email("Email tidak valid"),
  noHp: z.string().min(10, "No HP tidak valid").max(15),
  alamatAsal: z.string().min(10, "Alamat terlalu pendek"),
  kabupatenAsal: z.string().min(2, "Kabupaten wajib diisi"),
  alasanMasukAsrama: z
    .string()
    .min(30, "Alasan minimal 30 karakter"),
  preferensiKamar: z.enum(["putra", "putri"], {
    required_error: "Pilih preferensi kamar",
  }),
});

const kontakDaruratSchema = z.object({
  namaOrtu: z.string().min(3, "Nama wajib diisi"),
  hubunganOrtu: z.string().min(2, "Hubungan wajib diisi"),
  noHpOrtu: z.string().min(10, "No HP tidak valid").max(15),
});

const akunSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    konfirmasi: z.string(),
  })
  .refine((d) => d.password === d.konfirmasi, {
    message: "Password tidak sama",
    path: ["konfirmasi"],
  });

type BiodataData = z.infer<typeof biodataSchema>;
type AkademikData = z.infer<typeof akademikSchema>;
type KontakData = z.infer<typeof kontakSchema>;
type KontakDaruratData = z.infer<typeof kontakDaruratSchema>;
type AkunData = z.infer<typeof akunSchema>;

const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const GOLDAR = ["A", "B", "AB", "O", "Tidak Tahu"];

const STEPS = [
  { num: 1, label: "Biodata", icon: User },
  { num: 2, label: "Akademik", icon: BookOpen },
  { num: 3, label: "Kontak", icon: MapPin },
  { num: 4, label: "Darurat", icon: Phone },
  { num: 5, label: "Akun", icon: Lock },
];

export default function DaftarPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Collected data across steps
  const [biodata, setBiodata] = useState<BiodataData | null>(null);
  const [akademik, setAkademik] = useState<AkademikData | null>(null);
  const [kontak, setKontak] = useState<KontakData | null>(null);
  const [kontakDarurat, setKontakDarurat] = useState<KontakDaruratData | null>(null);

  // ── Forms ──────────────────────────────────────────────────────────────────

  const biodataForm = useForm<BiodataData>({
    resolver: zodResolver(biodataSchema),
    defaultValues: biodata ?? {},
  });

  const akademikForm = useForm<AkademikData>({
    resolver: zodResolver(akademikSchema),
    defaultValues: akademik ?? {},
  });

  const kontakForm = useForm<KontakData>({
    resolver: zodResolver(kontakSchema),
    defaultValues: kontak ?? {},
  });

  const kontakDaruratForm = useForm<KontakDaruratData>({
    resolver: zodResolver(kontakDaruratSchema),
    defaultValues: kontakDarurat ?? {},
  });

  const akunForm = useForm<AkunData>({
    resolver: zodResolver(akunSchema),
  });

  // ── Step handlers ──────────────────────────────────────────────────────────

  const onBiodata = (data: BiodataData) => {
    setBiodata(data);
    setStep(2);
  };

  const onAkademik = (data: AkademikData) => {
    setAkademik(data);
    setStep(3);
  };

  const onKontak = (data: KontakData) => {
    setKontak(data);
    setStep(4);
  };

  const onKontakDarurat = (data: KontakDaruratData) => {
    setKontakDarurat(data);
    setStep(5);
  };

  const onAkun = async (data: AkunData) => {
    if (!biodata || !akademik || !kontak || !kontakDarurat) return;
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        kontak.email,
        data.password
      );
      await updateProfile(cred.user, { displayName: biodata.namaLengkap });

      const now = Timestamp.now();
      await createUserProfile({
        uid: cred.user.uid,
        email: kontak.email,
        displayName: biodata.namaLengkap,
        role: "mahasiswa",
        noHp: kontak.noHp,
        createdAt: now,
        updatedAt: now,
      });

      await createPendaftaran({
        userId: cred.user.uid,
        status: "submitted",
        // Biodata
        namaLengkap: biodata.namaLengkap,
        nik: biodata.nik,
        tempatLahir: biodata.tempatLahir,
        tanggalLahir: biodata.tanggalLahir,
        jenisKelamin: biodata.jenisKelamin,
        agama: biodata.agama,
        golonganDarah: biodata.golonganDarah,
        // Kontak
        email: kontak.email,
        noHp: kontak.noHp,
        alamatAsal: kontak.alamatAsal,
        kabupatenAsal: kontak.kabupatenAsal,
        alasanMasukAsrama: kontak.alasanMasukAsrama,
        preferensiKamar: kontak.preferensiKamar,
        // Akademik
        nim: akademik.nim,
        universitas: akademik.universitas,
        fakultas: akademik.fakultas,
        jurusan: akademik.jurusan,
        semester: akademik.semester,
        ipk: akademik.ipk,
        // Kontak darurat
        namaOrtu: kontakDarurat.namaOrtu,
        hubunganOrtu: kontakDarurat.hubunganOrtu,
        noHpOrtu: kontakDarurat.noHpOrtu,
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
      });

      success("Pendaftaran berhasil dikirim!");
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        error("Email sudah terdaftar. Silakan login atau gunakan email lain.");
      } else if (msg.includes("weak-password")) {
        error("Password terlalu lemah.");
      } else {
        error("Gagal mendaftar. Periksa koneksi internet Anda.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Done screen ────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Pendaftaran Terkirim!
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Data Anda berhasil dikirim dan sedang menunggu seleksi oleh admin.
              Anda akan dihubungi melalui email{" "}
              <span className="font-bold text-primary-600">{kontak?.email}</span>{" "}
              apabila pendaftaran diterima.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-left space-y-3">
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest">
              Langkah Selanjutnya
            </p>
            <ul className="space-y-2 text-sm text-amber-800 font-medium">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                Admin akan meninjau pendaftaran Anda dan mengecek ketersediaan kamar.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                Jika diterima, Anda akan mendapat notifikasi email dari kami.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                Setelah diterima, login menggunakan email dan password yang sudah Anda buat.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              onClick={() => router.push("/login")}
              className="px-8 py-4 rounded-2xl font-bold"
            >
              Masuk ke Akun <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="px-8 py-4 rounded-2xl font-bold"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Progress bar ───────────────────────────────────────────────────────────

  const Progress = () => (
    <div className="flex items-center gap-1 mb-10">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = step === s.num;
        const done = step > s.num;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  done
                    ? "bg-green-500 text-white"
                    : active
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${
                  active ? "text-primary-600" : done ? "text-green-600" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 rounded-full transition-all duration-500 ${
                  step > s.num ? "bg-green-400" : "bg-slate-100"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── Layout shell ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm">
            Asrama Mahasiswa Jambi
          </span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
        >
          Sudah punya akun? <span className="text-primary-600">Masuk</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-start justify-center p-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Formulir Pendaftaran Asrama
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Isi data dengan lengkap dan benar. Admin akan meninjau dan menghubungi Anda.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <Progress />

            {/* ── STEP 1: BIODATA ─────────────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={biodataForm.handleSubmit(onBiodata)} className="space-y-5">
                <SectionTitle icon={User} title="Biodata Pribadi" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Input
                      label="Nama Lengkap"
                      placeholder="Sesuai KTP"
                      required
                      error={biodataForm.formState.errors.namaLengkap?.message}
                      {...biodataForm.register("namaLengkap")}
                    />
                  </div>
                  <Input
                    label="NIK (16 digit)"
                    placeholder="3201XXXXXXXXXXXX"
                    required
                    maxLength={16}
                    error={biodataForm.formState.errors.nik?.message}
                    {...biodataForm.register("nik")}
                  />
                  <Input
                    label="Tempat Lahir"
                    placeholder="Nama kota"
                    required
                    error={biodataForm.formState.errors.tempatLahir?.message}
                    {...biodataForm.register("tempatLahir")}
                  />
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                      {...biodataForm.register("tanggalLahir")}
                    />
                    {biodataForm.formState.errors.tanggalLahir && (
                      <p className="text-red-500 text-xs mt-1">
                        {biodataForm.formState.errors.tanggalLahir.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      {[
                        { val: "L", label: "Laki-laki" },
                        { val: "P", label: "Perempuan" },
                      ].map((opt) => (
                        <label
                          key={opt.val}
                          className="flex-1 flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50 border-slate-100 bg-slate-50"
                        >
                          <input
                            type="radio"
                            value={opt.val}
                            className="sr-only"
                            {...biodataForm.register("jenisKelamin")}
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {biodataForm.formState.errors.jenisKelamin && (
                      <p className="text-red-500 text-xs mt-1">
                        {biodataForm.formState.errors.jenisKelamin.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Agama <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                      {...biodataForm.register("agama")}
                    >
                      <option value="">-- Pilih Agama --</option>
                      {AGAMA.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    {biodataForm.formState.errors.agama && (
                      <p className="text-red-500 text-xs mt-1">
                        {biodataForm.formState.errors.agama.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Golongan Darah <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                      {...biodataForm.register("golonganDarah")}
                    >
                      <option value="">-- Pilih --</option>
                      {GOLDAR.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {biodataForm.formState.errors.golonganDarah && (
                      <p className="text-red-500 text-xs mt-1">
                        {biodataForm.formState.errors.golonganDarah.message}
                      </p>
                    )}
                  </div>
                </div>
                <NavButtons step={step} onBack={() => {}} isFirst loading={false} />
              </form>
            )}

            {/* ── STEP 2: AKADEMIK ────────────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={akademikForm.handleSubmit(onAkademik)} className="space-y-5">
                <SectionTitle icon={BookOpen} title="Data Akademik" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="NIM"
                    placeholder="Nomor Induk Mahasiswa"
                    required
                    error={akademikForm.formState.errors.nim?.message}
                    {...akademikForm.register("nim")}
                  />
                  <div className="sm:col-span-1">
                    <Input
                      label="Perguruan Tinggi"
                      placeholder="Nama universitas"
                      required
                      error={akademikForm.formState.errors.universitas?.message}
                      {...akademikForm.register("universitas")}
                    />
                  </div>
                  <Input
                    label="Fakultas"
                    placeholder="Nama fakultas"
                    required
                    error={akademikForm.formState.errors.fakultas?.message}
                    {...akademikForm.register("fakultas")}
                  />
                  <Input
                    label="Program Studi / Jurusan"
                    placeholder="Nama jurusan"
                    required
                    error={akademikForm.formState.errors.jurusan?.message}
                    {...akademikForm.register("jurusan")}
                  />
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Semester Berjalan <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                      {...akademikForm.register("semester")}
                    >
                      <option value="">-- Pilih --</option>
                      {Array.from({ length: 14 }, (_, i) => i + 1).map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                    {akademikForm.formState.errors.semester && (
                      <p className="text-red-500 text-xs mt-1">
                        {akademikForm.formState.errors.semester.message}
                      </p>
                    )}
                  </div>
                  <Input
                    label="IPK"
                    placeholder="Contoh: 3.75"
                    required
                    error={akademikForm.formState.errors.ipk?.message}
                    {...akademikForm.register("ipk")}
                  />
                </div>
                <NavButtons step={step} onBack={() => setStep(1)} loading={false} />
              </form>
            )}

            {/* ── STEP 3: KONTAK ──────────────────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={kontakForm.handleSubmit(onKontak)} className="space-y-5">
                <SectionTitle icon={MapPin} title="Kontak & Alamat" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Email Aktif"
                    type="email"
                    placeholder="Email untuk notifikasi"
                    required
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={kontakForm.formState.errors.email?.message}
                    {...kontakForm.register("email")}
                  />
                  <Input
                    label="No. WhatsApp"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    required
                    error={kontakForm.formState.errors.noHp?.message}
                    {...kontakForm.register("noHp")}
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Alamat Asal Lengkap <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
                      {...kontakForm.register("alamatAsal")}
                    />
                    {kontakForm.formState.errors.alamatAsal && (
                      <p className="text-red-500 text-xs mt-1">
                        {kontakForm.formState.errors.alamatAsal.message}
                      </p>
                    )}
                  </div>
                  <Input
                    label="Kabupaten/Kota Asal"
                    placeholder="Contoh: Kota Jambi"
                    required
                    error={kontakForm.formState.errors.kabupatenAsal?.message}
                    {...kontakForm.register("kabupatenAsal")}
                  />
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Preferensi Kamar <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      {[
                        { val: "putra", label: "Gedung Putra" },
                        { val: "putri", label: "Gedung Putri" },
                      ].map((opt) => (
                        <label
                          key={opt.val}
                          className="flex-1 flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50 border-slate-100 bg-slate-50"
                        >
                          <input
                            type="radio"
                            value={opt.val}
                            className="sr-only"
                            {...kontakForm.register("preferensiKamar")}
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {kontakForm.formState.errors.preferensiKamar && (
                      <p className="text-red-500 text-xs mt-1">
                        {kontakForm.formState.errors.preferensiKamar.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Alasan Masuk Asrama <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Ceritakan alasan Anda ingin tinggal di asrama ini (min. 30 karakter)..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-none"
                      {...kontakForm.register("alasanMasukAsrama")}
                    />
                    {kontakForm.formState.errors.alasanMasukAsrama && (
                      <p className="text-red-500 text-xs mt-1">
                        {kontakForm.formState.errors.alasanMasukAsrama.message}
                      </p>
                    )}
                  </div>
                </div>
                <NavButtons step={step} onBack={() => setStep(2)} loading={false} />
              </form>
            )}

            {/* ── STEP 4: KONTAK DARURAT ──────────────────────────────────── */}
            {step === 4 && (
              <form onSubmit={kontakDaruratForm.handleSubmit(onKontakDarurat)} className="space-y-5">
                <SectionTitle icon={Phone} title="Kontak Darurat" />
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium">
                    Data ini digunakan untuk menghubungi keluarga/wali dalam keadaan darurat.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Input
                      label="Nama Orang Tua / Wali"
                      placeholder="Nama lengkap"
                      required
                      error={kontakDaruratForm.formState.errors.namaOrtu?.message}
                      {...kontakDaruratForm.register("namaOrtu")}
                    />
                  </div>
                  <Input
                    label="Hubungan Keluarga"
                    placeholder="Contoh: Ayah, Ibu, Kakak"
                    required
                    error={kontakDaruratForm.formState.errors.hubunganOrtu?.message}
                    {...kontakDaruratForm.register("hubunganOrtu")}
                  />
                  <Input
                    label="No. HP Darurat"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    required
                    error={kontakDaruratForm.formState.errors.noHpOrtu?.message}
                    {...kontakDaruratForm.register("noHpOrtu")}
                  />
                </div>
                <NavButtons step={step} onBack={() => setStep(3)} loading={false} />
              </form>
            )}

            {/* ── STEP 5: BUAT AKUN ───────────────────────────────────────── */}
            {step === 5 && (
              <form onSubmit={akunForm.handleSubmit(onAkun)} className="space-y-5">
                <SectionTitle icon={Lock} title="Buat Akun Login" />
                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex gap-3">
                  <Mail className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-primary-700 uppercase tracking-widest">
                      Email Akun
                    </p>
                    <p className="text-sm font-bold text-primary-800 mt-0.5">{kontak?.email}</p>
                    <p className="text-xs text-primary-600 mt-1">
                      Gunakan email ini untuk login setelah diterima.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 8 karakter"
                    required
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={akunForm.formState.errors.password?.message}
                    {...akunForm.register("password")}
                  />
                  <Input
                    label="Konfirmasi Password"
                    type="password"
                    placeholder="Ulangi password"
                    required
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={akunForm.formState.errors.konfirmasi?.message}
                    {...akunForm.register("konfirmasi")}
                  />
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Ringkasan Pendaftaran
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 font-medium">
                    <span className="text-slate-400">Nama</span>
                    <span className="font-bold">{biodata?.namaLengkap}</span>
                    <span className="text-slate-400">Universitas</span>
                    <span className="font-bold">{akademik?.universitas}</span>
                    <span className="text-slate-400">Email</span>
                    <span className="font-bold">{kontak?.email}</span>
                    <span className="text-slate-400">Preferensi</span>
                    <span className="font-bold capitalize">{kontak?.preferensiKamar}</span>
                  </div>
                </div>

                <NavButtons step={step} onBack={() => setStep(4)} loading={submitting} isLast />
              </form>
            )}
          </div>

          <p className="text-center text-sm text-slate-400 font-medium mt-6">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link href="/terms-of-service" className="text-primary-600 hover:underline font-bold">
              Syarat & Ketentuan
            </Link>{" "}
            kami.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-50">
      <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{title}</h2>
    </div>
  );
}

function NavButtons({
  step,
  onBack,
  isFirst,
  isLast,
  loading,
}: {
  step: number;
  onBack: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex gap-3 pt-4">
      {!isFirst && (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl font-bold"
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Kembali
        </Button>
      )}
      <Button
        type="submit"
        loading={loading}
        className="flex-1 py-4 rounded-2xl font-bold shadow-premium"
      >
        {isLast ? (
          <>Kirim Pendaftaran</>
        ) : (
          <>
            Selanjutnya <ArrowRight className="w-4 h-4 ml-1 inline" />
          </>
        )}
      </Button>
    </div>
  );
}
