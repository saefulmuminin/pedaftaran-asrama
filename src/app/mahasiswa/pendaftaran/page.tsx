"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import {
  Save, Send, User, BookOpen, MapPin, PhoneCall, FileUp,
  Clock, ArrowRight, ArrowLeft, DoorOpen, CheckCircle, Info, ScanLine,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getPendaftaranByUser, createPendaftaran, updatePendaftaran,
  getAllKamar, getPendaftaranById,
} from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FileUpload } from "@/components/ui/FileUpload";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { KTPScanner } from "@/components/ui/KTPScanner";
import { cn } from "@/lib/utils";
import type { Pendaftaran, Kamar } from "@/types";

// ───── NIK helpers ─────
const validateNIK = (nik: string) => {
  if (nik.length !== 16 || !/^\d{16}$/.test(nik)) return false;
  const d = parseInt(nik.substring(6, 8));
  const m = parseInt(nik.substring(8, 10));
  return (d >= 1 && d <= 31) || (d >= 41 && d <= 71) && m >= 1 && m <= 12;
};
const nikMatchesGender = (nik: string, g: "L" | "P") => {
  const d = parseInt(nik.substring(6, 8));
  return g === "L" ? d <= 31 : d >= 41;
};

// ───── Step schemas ─────
const S_BIODATA = z.object({
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z.string().length(16, "NIK harus 16 digit").regex(/^\d{16}$/, "NIK hanya angka")
    .refine(validateNIK, "Format NIK tidak valid"),
  tempatLahir: z.string().min(2, "Wajib diisi"),
  tanggalLahir: z.string().min(1, "Wajib diisi"),
  jenisKelamin: z.enum(["L", "P"], { errorMap: () => ({ message: "Wajib dipilih" }) }),
  agama: z.string().min(1, "Wajib dipilih"),
  golonganDarah: z.string().min(1, "Wajib dipilih"),
});
const S_AKADEMIK = z.object({
  nim: z.string().min(5, "NIM tidak valid"),
  universitas: z.string().min(3, "Wajib diisi"),
  fakultas: z.string().min(3, "Wajib diisi"),
  jurusan: z.string().min(3, "Wajib diisi"),
  semester: z.coerce.number().min(1, "Min 1").max(14, "Max 14"),
  ipk: z.string().min(1, "Wajib diisi"),
});
const S_ALAMAT = z.object({
  email: z.string().email("Email tidak valid"),
  noHp: z.string().min(10, "No. HP tidak valid"),
  alamatAsal: z.string().min(10, "Minimal 10 karakter"),
  kabupatenAsal: z.string().min(2, "Wajib diisi"),
  preferensiKamar: z.enum(["putra", "putri"], { errorMap: () => ({ message: "Wajib dipilih" }) }),
  alasanMasukAsrama: z.string().min(20, "Minimal 20 karakter"),
});
const S_KONTAK = z.object({
  namaOrtu: z.string().min(3, "Wajib diisi"),
  hubunganOrtu: z.string().min(2, "Wajib diisi"),
  noHpOrtu: z.string().min(10, "No. HP tidak valid"),
});

const FULL_SCHEMA = z.object({
  ...S_BIODATA.shape, ...S_AKADEMIK.shape,
  ...S_ALAMAT.shape, ...S_KONTAK.shape,
});
type FormData = z.infer<typeof FULL_SCHEMA>;

const STEPS = ["biodata", "akademik", "alamat", "kontak", "kamar", "dokumen"] as const;
type Step = typeof STEPS[number];
const STEP_META = [
  { id: "biodata", label: "Biodata", icon: User },
  { id: "akademik", label: "Akademik", icon: BookOpen },
  { id: "alamat", label: "Alamat", icon: MapPin },
  { id: "kontak", label: "Kontak", icon: PhoneCall },
  { id: "kamar", label: "Pilih Kamar", icon: DoorOpen },
  { id: "dokumen", label: "Dokumen", icon: FileUp },
];

const DEFAULTS: FormData = {
  namaLengkap: "", nik: "", tempatLahir: "", tanggalLahir: "",
  jenisKelamin: "L", agama: "", golonganDarah: "", noHp: "", email: "",
  alamatAsal: "", kabupatenAsal: "", nim: "", universitas: "", fakultas: "",
  jurusan: "", semester: 1, ipk: "", alasanMasukAsrama: "",
  preferensiKamar: "putra", namaOrtu: "", hubunganOrtu: "", noHpOrtu: "",
};

const agamaOpts = ["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"].map(v=>({value:v,label:v}));
const golDarahOpts = ["A","B","AB","O","Tidak Tahu"].map(v=>({value:v,label:v}));
const kabOpts = ["Kota Jambi","Batanghari","Bungo","Kerinci","Merangin","Muaro Jambi",
  "Sarolangun","Sungai Penuh","Tanjung Jabung Barat","Tanjung Jabung Timur","Tebo"]
  .map(v=>({value:v,label:v}));

export default function PendaftaranPage() {
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [existing, setExisting] = useState<Pendaftaran | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<Step>("biodata");
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [docs, setDocs] = useState({ foto: "", ktp: "", ktm: "", suratKeterangan: "" });
  const [kamarList, setKamarList] = useState<Kamar[]>([]);
  const [loadingKamar, setLoadingKamar] = useState(false);
  const [selectedKamarId, setSelectedKamarId] = useState("");
  const [selectedKamarNomor, setSelectedKamarNomor] = useState("");

  const {
    register, handleSubmit, reset, getValues, setValue, watch,
    formState: { errors }, setError,
  } = useForm<FormData>({ resolver: zodResolver(FULL_SCHEMA), defaultValues: DEFAULTS });

  const watchNik = watch("nik");
  const watchGender = watch("jenisKelamin");

  // ─── Load data ───
  useEffect(() => {
    const load = async () => {
      if (!userProfile) return;
      const p = await getPendaftaranByUser(userProfile.uid);
      if (p) {
        setExisting(p);
        reset({
          namaLengkap: p.namaLengkap||"", nik: p.nik||"",
          tempatLahir: p.tempatLahir||"", tanggalLahir: p.tanggalLahir||"",
          jenisKelamin: p.jenisKelamin||"L", agama: p.agama||"",
          golonganDarah: p.golonganDarah||"", noHp: p.noHp||userProfile.noHp||"",
          email: p.email||userProfile.email||"", alamatAsal: p.alamatAsal||"",
          kabupatenAsal: p.kabupatenAsal||"", nim: p.nim||"",
          universitas: p.universitas||"", fakultas: p.fakultas||"",
          jurusan: p.jurusan||"", semester: p.semester||1,
          ipk: p.ipk||"", alasanMasukAsrama: p.alasanMasukAsrama||"",
          preferensiKamar: p.preferensiKamar||"putra",
          namaOrtu: p.namaOrtu||"", hubunganOrtu: p.hubunganOrtu||"", noHpOrtu: p.noHpOrtu||"",
        });
        setDocs({ foto: p.fotoUrl??"", ktp: p.ktpUrl??"", ktm: p.ktmUrl??"", suratKeterangan: p.suratKeteranganUrl??"" });
        if (p.nomorKamar) setSelectedKamarNomor(p.nomorKamar);
        setCompletedSteps(new Set(["biodata","akademik","alamat","kontak"] as Step[]));
      } else {
        reset({ ...DEFAULTS, namaLengkap: userProfile.displayName||"", email: userProfile.email||"", noHp: userProfile.noHp||"" });
      }
      setLoading(false);
    };
    load();
  }, [userProfile, reset]);

  useEffect(() => {
    if (activeStep === "kamar" && kamarList.length === 0) {
      setLoadingKamar(true);
      getAllKamar().then(setKamarList).finally(() => setLoadingKamar(false));
    }
  }, [activeStep]);

  const isReadOnly = !!existing && existing.status !== "draft" && existing.status !== "ditolak";

  // ─── KTP scan auto-fill ───
  const handleKTPResult = (data: import("@/components/ui/KTPScanner").KTPData) => {
    if (data.namaLengkap) setValue("namaLengkap", data.namaLengkap, { shouldValidate: true });
    if (data.nik)         setValue("nik", data.nik, { shouldValidate: true });
    if (data.tempatLahir) setValue("tempatLahir", data.tempatLahir, { shouldValidate: true });
    if (data.tanggalLahir) setValue("tanggalLahir", data.tanggalLahir, { shouldValidate: true });
    if (data.jenisKelamin) setValue("jenisKelamin", data.jenisKelamin, { shouldValidate: true });
    if (data.agama) setValue("agama", data.agama, { shouldValidate: true });
    if (data.alamatAsal) setValue("alamatAsal", data.alamatAsal, { shouldValidate: true });
    if (data.kabupatenAsal) setValue("kabupatenAsal", data.kabupatenAsal, { shouldValidate: true });
    if (data.ktpUrl) setDocs(d => ({ ...d, ktp: data.ktpUrl! }));
    success("Data KTP berhasil diisi otomatis! Periksa dan lengkapi jika ada yang kurang.");
  };

  // ─── Per-step validation (no trigger, use safeParse) ───
  const validateStep = (step: Step): boolean => {
    const vals = getValues();
    const schemas: Partial<Record<Step, z.ZodObject<any>>> = {
      biodata: S_BIODATA, akademik: S_AKADEMIK, alamat: S_ALAMAT, kontak: S_KONTAK,
    };
    const schema = schemas[step];
    if (!schema) return true;

    const result = schema.safeParse(vals);
    if (!result.success) {
      result.error.issues.forEach(i => {
        if (i.path[0]) setError(i.path[0] as keyof FormData, { message: i.message });
      });
      // Extra NIK vs gender check
      if (step === "biodata" && vals.nik?.length === 16 && validateNIK(vals.nik) && !nikMatchesGender(vals.nik, vals.jenisKelamin)) {
        setError("nik", { message: "NIK tidak sesuai jenis kelamin" });
      }
      return false;
    }
    return true;
  };

  const goNext = (from: Step, to: Step) => {
    if (!isReadOnly && !validateStep(from)) {
      error("Harap lengkapi semua data yang wajib diisi");
      return;
    }
    if (from === "kamar" && !selectedKamarId && !existing?.nomorKamar) {
      error("Pilih kamar terlebih dahulu");
      return;
    }
    setCompletedSteps(prev => new Set([...prev, from]));
    setActiveStep(to);
  };
  const goBack = (to: Step) => setActiveStep(to);

  const buildPayload = (data: FormData) => ({
    userId: userProfile!.uid, ...data,
    fotoUrl: docs.foto||"", ktpUrl: docs.ktp||"",
    ktmUrl: docs.ktm||"", suratKeteranganUrl: docs.suratKeterangan||"",
    nomorKamar: selectedKamarNomor||existing?.nomorKamar||"",
    updatedAt: Timestamp.now(),
  });

  const handleSaveDraft = handleSubmit(async (data) => {
    setSaving(true);
    try {
      const payload = { ...buildPayload(data), status: "draft" as const };
      if (existing) {
        await updatePendaftaran(existing.id, payload);
      } else {
        const id = await createPendaftaran({ ...payload, createdAt: Timestamp.now() });
        setExisting(await getPendaftaranById(id));
      }
      success("Draft tersimpan!");
    } catch { error("Gagal menyimpan."); } finally { setSaving(false); }
  });

  const handleSubmitForm = handleSubmit(async (data) => {
    if (!docs.foto || !docs.ktp || !docs.ktm) { error("Upload Foto, KTP, dan KTM terlebih dahulu"); return; }
    if (!selectedKamarId && !existing?.nomorKamar) { error("Pilih kamar terlebih dahulu"); setActiveStep("kamar"); return; }
    setSubmitting(true);
    try {
      const payload = { ...buildPayload(data), status: "submitted" as const, submittedAt: Timestamp.now() };
      if (existing) { await updatePendaftaran(existing.id, payload); setExisting({ ...existing, ...payload }); }
      else await createPendaftaran({ ...payload, createdAt: Timestamp.now() });
      success("Pendaftaran berhasil dikirim!");
    } catch { error("Gagal mengirim."); } finally { setSubmitting(false); }
  });

  // ─── NIK decode info ───
  const nikInfo = (() => {
    if (!watchNik || watchNik.length !== 16 || !validateNIK(watchNik)) return null;
    const d = parseInt(watchNik.substring(6,8));
    const isW = d >= 41;
    const m = parseInt(watchNik.substring(8,10));
    const y = parseInt(watchNik.substring(10,12));
    return { gender: isW?"Perempuan":"Laki-laki", tgl:`${(isW?d-40:d).toString().padStart(2,"0")}/${m.toString().padStart(2,"0")}/${y<=24?2000+y:1900+y}` };
  })();

  const availableKamar = kamarList.filter(k => k.jenisKelamin === (watchGender||existing?.jenisKelamin||"L") && k.status === "tersedia");

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Formulir...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Formulir Pendaftaran</h1>
          <p className="text-slate-500 font-medium mt-1">Lengkapi semua langkah secara berurutan.</p>
        </div>
        {existing && <Badge status={existing.status} />}
      </div>

      {isReadOnly && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary-600 shrink-0" />
          <p className="text-sm text-primary-700 font-medium">Formulir terkunci — pendaftaran sedang diproses.</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center">
          {STEP_META.map((s, i) => {
            const done = completedSteps.has(s.id as Step);
            const active = activeStep === s.id;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    done ? "bg-emerald-500 text-white" : active ? "bg-primary-600 text-white ring-4 ring-primary-100" : "bg-slate-100 text-slate-400")}>
                    {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-wider hidden sm:block text-center",
                    active?"text-primary-600":done?"text-emerald-600":"text-slate-400")}>{s.label}</span>
                </div>
                {i < STEP_META.length-1 && (
                  <div className={cn("flex-1 h-0.5 mx-1 rounded-full", done?"bg-emerald-400":"bg-slate-100")} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 font-bold mt-3 pt-3 border-t border-slate-50 text-right">
          {STEP_META.find(s=>s.id===activeStep)?.label} — Langkah {STEPS.indexOf(activeStep)+1}/{STEPS.length}
        </p>
      </div>

      <form onSubmit={e=>e.preventDefault()}>
        {/* ─── STEP 1: BIODATA + KTP SCAN ─── */}
        {activeStep === "biodata" && (
          <Card className="p-8 space-y-6 border-none shadow-premium bg-white rounded-2xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-50">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600"><User className="w-5 h-5" /></div>
              <div><h2 className="font-extrabold text-slate-900">Biodata Pribadi</h2><p className="text-xs text-slate-400">Identitas resmi sesuai KTP</p></div>
            </div>

            {/* KTP Scanner */}
            {!isReadOnly && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <ScanLine className="w-3.5 h-3.5 text-primary-500" />
                  Scan KTP Otomatis
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold normal-case tracking-normal">Gratis · AI OCR</span>
                </div>
                <KTPScanner
                  onResult={handleKTPResult}
                  ktpUrl={docs.ktp}
                  onClear={() => setDocs(d => ({ ...d, ktp: "" }))}
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Upload foto KTP untuk mengisi form otomatis. Akurasi bervariasi — harap periksa kembali hasil scan.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Input label="Nama Lengkap" placeholder="Sesuai KTP" required disabled={isReadOnly} error={errors.namaLengkap?.message} {...register("namaLengkap")} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Input label="NIK (16 digit)" placeholder="Nomor Induk Kependudukan" required maxLength={16} disabled={isReadOnly} error={errors.nik?.message} {...register("nik")} />
                {nikInfo && !errors.nik && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    NIK Valid — Terdekode: <strong>{nikInfo.gender}</strong>, lahir <strong>{nikInfo.tgl}</strong>
                  </div>
                )}
              </div>
              <Input label="Tempat Lahir" placeholder="Kota kelahiran" required disabled={isReadOnly} error={errors.tempatLahir?.message} {...register("tempatLahir")} />
              <Input label="Tanggal Lahir" type="date" required disabled={isReadOnly} error={errors.tanggalLahir?.message} {...register("tanggalLahir")} />
              <Select label="Jenis Kelamin" required disabled={isReadOnly} error={errors.jenisKelamin?.message} options={[{value:"L",label:"Laki-laki"},{value:"P",label:"Perempuan"}]} {...register("jenisKelamin")} />
              <Select label="Agama" required disabled={isReadOnly} error={errors.agama?.message} options={agamaOpts} {...register("agama")} />
              <Select label="Golongan Darah" required disabled={isReadOnly} error={errors.golonganDarah?.message} options={golDarahOpts} {...register("golonganDarah")} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={()=>goNext("biodata","akademik")} icon={<ArrowRight className="w-4 h-4" />}>Lanjut ke Akademik</Button>
            </div>
          </Card>
        )}

        {/* ─── STEP 2: AKADEMIK ─── */}
        {activeStep === "akademik" && (
          <Card className="p-8 space-y-6 border-none shadow-premium bg-white rounded-2xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-50">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600"><BookOpen className="w-5 h-5" /></div>
              <div><h2 className="font-extrabold text-slate-900">Data Akademik</h2><p className="text-xs text-slate-400">Informasi studi saat ini</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="NIM" placeholder="Nomor Induk Mahasiswa" required disabled={isReadOnly} error={errors.nim?.message} {...register("nim")} />
              <div className="md:col-span-2"><Input label="Universitas" required disabled={isReadOnly} error={errors.universitas?.message} {...register("universitas")} /></div>
              <Input label="Fakultas" required disabled={isReadOnly} error={errors.fakultas?.message} {...register("fakultas")} />
              <Input label="Jurusan/Prodi" required disabled={isReadOnly} error={errors.jurusan?.message} {...register("jurusan")} />
              <Input label="Semester" type="number" min={1} max={14} required disabled={isReadOnly} error={errors.semester?.message} {...register("semester")} />
              <Input label="IPK Terakhir" placeholder="Contoh: 3.50" required disabled={isReadOnly} error={errors.ipk?.message} {...register("ipk")} />
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={()=>goBack("biodata")} icon={<ArrowLeft className="w-4 h-4" />}>Kembali</Button>
              <Button type="button" onClick={()=>goNext("akademik","alamat")} icon={<ArrowRight className="w-4 h-4" />}>Lanjut ke Alamat</Button>
            </div>
          </Card>
        )}

        {/* ─── STEP 3: ALAMAT ─── */}
        {activeStep === "alamat" && (
          <Card className="p-8 space-y-6 border-none shadow-premium bg-white rounded-2xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-50">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600"><MapPin className="w-5 h-5" /></div>
              <div><h2 className="font-extrabold text-slate-900">Alamat & Asal</h2><p className="text-xs text-slate-400">Domisili di Provinsi Jambi</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Email" type="email" required disabled={isReadOnly} error={errors.email?.message} {...register("email")} />
              <Input label="No. HP / WhatsApp" placeholder="08xxxxxxxxxx" required disabled={isReadOnly} error={errors.noHp?.message} {...register("noHp")} />
              <div className="md:col-span-2"><TextArea label="Alamat Asal Lengkap" required disabled={isReadOnly} error={errors.alamatAsal?.message} {...register("alamatAsal")} /></div>
              <Select label="Kabupaten/Kota Asal" required disabled={isReadOnly} error={errors.kabupatenAsal?.message} options={kabOpts} {...register("kabupatenAsal")} />
              <Select label="Preferensi Gedung" required disabled={isReadOnly} error={errors.preferensiKamar?.message} options={[{value:"putra",label:"Gedung Putra"},{value:"putri",label:"Gedung Putri"}]} {...register("preferensiKamar")} />
              <div className="md:col-span-2"><TextArea label="Alasan Masuk Asrama" placeholder="Min. 20 karakter..." required disabled={isReadOnly} error={errors.alasanMasukAsrama?.message} {...register("alasanMasukAsrama")} /></div>
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={()=>goBack("akademik")} icon={<ArrowLeft className="w-4 h-4" />}>Kembali</Button>
              <Button type="button" onClick={()=>goNext("alamat","kontak")} icon={<ArrowRight className="w-4 h-4" />}>Lanjut ke Kontak</Button>
            </div>
          </Card>
        )}

        {/* ─── STEP 4: KONTAK ─── */}
        {activeStep === "kontak" && (
          <Card className="p-8 space-y-6 border-none shadow-premium bg-white rounded-2xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-50">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><PhoneCall className="w-5 h-5" /></div>
              <div><h2 className="font-extrabold text-slate-900">Kontak Darurat</h2><p className="text-xs text-slate-400">Orang tua atau wali</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Nama Ortu/Wali" required disabled={isReadOnly} error={errors.namaOrtu?.message} {...register("namaOrtu")} />
              <Select label="Hubungan" required disabled={isReadOnly} error={errors.hubunganOrtu?.message} options={[{value:"Ayah",label:"Ayah"},{value:"Ibu",label:"Ibu"},{value:"Wali",label:"Wali"}]} {...register("hubunganOrtu")} />
              <Input label="No. HP Ortu/Wali" placeholder="08xxxxxxxxxx" required disabled={isReadOnly} error={errors.noHpOrtu?.message} {...register("noHpOrtu")} />
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={()=>goBack("alamat")} icon={<ArrowLeft className="w-4 h-4" />}>Kembali</Button>
              <Button type="button" onClick={()=>goNext("kontak","kamar")} icon={<ArrowRight className="w-4 h-4" />}>Lanjut Pilih Kamar</Button>
            </div>
          </Card>
        )}

        {/* ─── STEP 5: KAMAR ─── */}
        {activeStep === "kamar" && (
          <Card className="p-8 space-y-6 border-none shadow-premium bg-white rounded-2xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-50">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><DoorOpen className="w-5 h-5" /></div>
              <div><h2 className="font-extrabold text-slate-900">Pilih Kamar</h2><p className="text-xs text-slate-400">Kamar tersedia untuk {watchGender==="L"?"Putra":"Putri"}</p></div>
            </div>
            {isReadOnly && existing?.nomorKamar ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="text-sm text-emerald-800 font-semibold">Kamar {existing.nomorKamar} sudah dipilih</p>
              </div>
            ) : loadingKamar ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : availableKamar.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl">
                <DoorOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Tidak ada kamar tersedia</p>
                <p className="text-sm text-slate-400 mt-1">Semua kamar {watchGender==="L"?"putra":"putri"} sudah penuh.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableKamar.map(k => {
                  const isSelected = selectedKamarId===k.id || (selectedKamarNomor===k.nomorKamar && !selectedKamarId);
                  const pct = Math.round((k.terisi/k.kapasitas)*100);
                  return (
                    <label key={k.id} className={cn("flex flex-col gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                      isSelected?"border-primary-500 bg-primary-50":"border-slate-100 hover:border-primary-200")}>
                      <input type="radio" className="sr-only" checked={isSelected} onChange={()=>{setSelectedKamarId(k.id);setSelectedKamarNomor(k.nomorKamar);}} />
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-extrabold text-slate-900">Kamar {k.nomorKamar}</p>
                          <p className="text-xs text-slate-400">Lantai {k.lantai} — {k.terisi}/{k.kapasitas} terisi</p>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-primary-600" />}
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full",pct>=75?"bg-amber-400":"bg-emerald-500")} style={{width:`${pct}%`}} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{k.kapasitas-k.terisi} tempat tersisa</p>
                      {k.fasilitas.length>0 && (
                        <div className="flex flex-wrap gap-1">
                          {k.fasilitas.map(f=><span key={f} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">{f}</span>)}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={()=>goBack("kontak")} icon={<ArrowLeft className="w-4 h-4" />}>Kembali</Button>
              <Button type="button" disabled={!selectedKamarId && !existing?.nomorKamar} onClick={()=>goNext("kamar","dokumen")} icon={<ArrowRight className="w-4 h-4" />}>Lanjut Upload Dokumen</Button>
            </div>
          </Card>
        )}

        {/* ─── STEP 6: DOKUMEN ─── */}
        {activeStep === "dokumen" && (
          <Card className="p-8 space-y-6 border-none shadow-premium bg-white rounded-2xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-50">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><FileUp className="w-5 h-5" /></div>
              <div>
                <h2 className="font-extrabold text-slate-900">Upload Dokumen</h2>
                <p className="text-xs text-slate-400">Persyaratan berkas digital</p>
              </div>
            </div>

            {docs.ktp && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">KTP sudah diunggah dari proses scan di step Biodata.</span>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 font-medium flex gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              Format JPG, PNG, PDF — maks. 5MB. Tanda <span className="text-red-500 font-bold">*</span> wajib diunggah.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload label="Foto Terbaru" type="foto" required value={docs.foto} onChange={url=>setDocs(d=>({...d,foto:url}))} onClear={()=>setDocs(d=>({...d,foto:""}))} />
              <FileUpload label="KTP" type="ktp" required value={docs.ktp} onChange={url=>setDocs(d=>({...d,ktp:url}))} onClear={()=>setDocs(d=>({...d,ktp:""}))} />
              <FileUpload label="Kartu Tanda Mahasiswa (KTM)" type="ktm" required value={docs.ktm} onChange={url=>setDocs(d=>({...d,ktm:url}))} onClear={()=>setDocs(d=>({...d,ktm:""}))} />
              <FileUpload label="Surat Keterangan Mahasiswa Aktif" type="suratKeterangan" value={docs.suratKeterangan} onChange={url=>setDocs(d=>({...d,suratKeterangan:url}))} onClear={()=>setDocs(d=>({...d,suratKeterangan:""}))} />
            </div>

            {(selectedKamarNomor||existing?.nomorKamar) && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm">
                <p className="font-semibold text-slate-700">Kamar dipilih: <strong>No. {selectedKamarNomor||existing?.nomorKamar}</strong></p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2 border-t border-slate-50">
              <Button type="button" variant="outline" onClick={()=>goBack("kamar")} icon={<ArrowLeft className="w-4 h-4" />}>Kembali</Button>
              {!isReadOnly && (
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" loading={saving} icon={<Save className="w-4 h-4" />} onClick={handleSaveDraft}>Simpan Draft</Button>
                  <Button type="button" loading={submitting} icon={<Send className="w-4 h-4" />} onClick={handleSubmitForm}>Kirim Pendaftaran</Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}
