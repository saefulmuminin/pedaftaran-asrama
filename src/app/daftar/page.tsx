"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  BookOpen,
  MapPin,
  Phone,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Info,
  ScanLine,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Menu,
  ArrowUp,
  FileImage,
  Upload,
  Camera,
  FileText as FileTextIcon,
} from "lucide-react";
import { addDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { fileToBase64 } from "@/lib/storage";

// ── KTP OCR helpers ───────────────────────────────────────────────────────────

interface KTPData {
  nik?: string;
  namaLengkap?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: "L" | "P";
  agama?: string;
  golonganDarah?: string;
  alamatAsal?: string;
  kabupatenAsal?: string;
}

function parseDate(raw: string): string {
  const clean = raw.replace(/[^0-9]/g, "-").replace(/--+/g, "-");
  const parts = clean.split("-").filter(Boolean);
  if (parts.length < 3) return "";
  const [d, m, y] = parts;
  const fullY = y.length === 2 ? (parseInt(y) <= 30 ? `20${y}` : `19${y}`) : y;
  if (fullY.length !== 4) return "";
  return `${fullY}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseKTPText(rawText: string): KTPData {
  const text = rawText.replace(/[|}{[\]\\]/g, " ").replace(/\s+/g, " ").toUpperCase();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: KTPData = {};

  const nikMatch = text.match(/\b(\d{16})\b/);
  if (nikMatch) result.nik = nikMatch[1];

  for (const line of lines) {
    const m = line.match(/NAMA\s*[:.]*\s*([A-Z\s]{3,40})/);
    if (m) {
      result.namaLengkap = m[1].trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  for (const line of lines) {
    const m = line.match(
      /(?:TEMPAT[/,]?\s*TGL|LAHIR)[^A-Z]*([A-Z\s]{2,25})[,/]\s*(\d{2}[-./]\d{2}[-./]\d{4})/i
    );
    if (m) {
      result.tempatLahir = m[1].trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      result.tanggalLahir = parseDate(m[2]);
      break;
    }
  }

  if (text.includes("LAKI-LAKI") || text.includes("LAKI LAKI")) result.jenisKelamin = "L";
  else if (text.includes("PEREMPUAN")) result.jenisKelamin = "P";

  // Golongan darah — KTP: "Gol. Darah : O" / "GOL DARAH AB" / "GOL.DARAH B"
  const golMatch = text.match(/GOL[\s.,]*DARAH[^A-Z0-9]*([AB]B?|O)\b/i);
  if (golMatch) {
    const g = golMatch[1].toUpperCase();
    if (["A", "B", "AB", "O"].includes(g)) result.golonganDarah = g;
  }

  for (const ag of ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"]) {
    if (text.includes(ag)) {
      result.agama = ag.charAt(0) + ag.slice(1).toLowerCase();
      break;
    }
  }

  for (const line of lines) {
    const m = line.match(/^ALAMAT\s*[:.]*\s*(.{3,})/);
    if (m) {
      result.alamatAsal = m[1].trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  const kabList = [
    "KOTA JAMBI", "BATANGHARI", "BUNGO", "KERINCI", "MERANGIN", "MUARO JAMBI",
    "SAROLANGUN", "SUNGAI PENUH", "TANJUNG JABUNG BARAT", "TANJUNG JABUNG TIMUR", "TEBO",
  ];
  for (const k of kabList) {
    if (text.includes(k)) {
      result.kabupatenAsal = k.charAt(0) + k.slice(1).toLowerCase();
      break;
    }
  }

  return result;
}

// ── KTP Scanner (OCR only — no login / no upload needed) ─────────────────────

function KTPScannerPublic({
  onResult,
}: {
  onResult: (data: KTPData, imageBase64: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [filledCount, setFilledCount] = useState(0);

  // Resize + compress KTP image jadi base64 sebelum upload ke Firestore.
  // Max 1200px, JPEG 0.75 — biasanya jadi ~150 KB dari foto KTP HP.
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1200;
          let { width, height } = img;
          if (width > height && width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas tidak tersedia"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = () => reject(new Error("Gagal load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal baca file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("scanning");
    setProgressMsg("Memproses gambar...");
    setProgress(10);

    let imageBase64 = "";
    try {
      imageBase64 = await compressImage(file);
    } catch (err) {
      console.error("Compress KTP gagal:", err);
      setStatus("error");
      return;
    }

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("ind+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(10 + Math.round(m.progress * 80));
            setProgressMsg(`Membaca KTP... ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      setProgress(95);
      setProgressMsg("Menganalisis data...");
      const parsed = parseKTPText(data.text);
      const count = Object.values(parsed).filter(Boolean).length;
      setFilledCount(count);
      setProgress(100);
      setStatus("done");
      onResult(parsed, imageBase64);
    } catch (e) {
      console.error("KTP OCR error:", e);
      // OCR gagal tapi image sudah ada — tetap simpan image, kirim parsed kosong
      setFilledCount(0);
      setStatus("done");
      onResult({}, imageBase64);
    }
  };

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setProgressMsg("");
    setPreviewUrl("");
    setFilledCount(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (status === "idle") {
    return (
      <div
        className="border-2 border-dashed border-primary-200 rounded-2xl p-5 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-all"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ScanLine className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-sm font-bold text-slate-700">Upload foto KTP untuk isi otomatis</p>
        <p className="text-xs text-slate-400 mt-1">JPG / PNG — foto harus jelas dan tidak buram</p>
        <p className="text-[10px] text-primary-500 font-bold mt-2 uppercase tracking-wider">
          ⚡ AI scan — form terisi otomatis
        </p>
      </div>
    );
  }

  if (status === "scanning") {
    return (
      <div className="border-2 border-primary-200 rounded-2xl p-5 bg-primary-50/30 space-y-3">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="KTP preview"
            className="w-full h-56 object-contain bg-slate-100 rounded-xl border border-primary-100 p-2"
          />
        )}
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
          <p className="text-sm font-bold text-primary-700">{progressMsg}</p>
        </div>
        <div className="w-full bg-primary-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border-2 border-red-200 rounded-2xl p-4 bg-red-50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-red-700">Gagal membaca KTP</p>
          <p className="text-xs text-red-500 mt-0.5">Gunakan foto lebih jelas, atau isi form manual.</p>
        </div>
        <button onClick={reset} className="text-red-400 hover:text-red-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // done
  return (
    <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-emerald-50/40 space-y-2">
      {previewUrl && (
        <img
          src={previewUrl}
          alt="KTP"
          className="w-full h-56 object-contain bg-slate-100 rounded-xl border border-emerald-100 p-2"
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">KTP berhasil dibaca!</p>
            <p className="text-xs text-emerald-600">{filledCount} field terisi otomatis</p>
          </div>
        </div>
        <button
          onClick={reset}
          title="Scan ulang"
          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-slate-400">
        Periksa dan koreksi data di form jika ada yang kurang tepat.
      </p>
    </div>
  );
}

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
  // Opsional — kadang KTP foto buram & gol darah tidak ter-OCR
  golonganDarah: z.string().optional(),
});

const akademikSchema = z.object({
  nim: z.string().min(5, "NIM tidak valid"),
  universitas: z.string().min(3, "Nama universitas wajib diisi"),
  fakultas: z.string().min(2, "Nama fakultas wajib diisi"),
  jurusan: z.string().min(2, "Nama jurusan wajib diisi"),
  semester: z.coerce.number().min(1).max(14),
  // Opsional — mahasiswa baru (semester 1) belum punya IPK
  ipk: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^\d(\.\d{1,2})?$/.test(v),
      "Format IPK tidak valid (contoh: 3.5)"
    ),
});

const kontakSchema = z.object({
  email: z.string().email("Email tidak valid"),
  noHp: z.string().min(10, "No HP tidak valid").max(15),
  alamatAsal: z.string().min(10, "Alamat terlalu pendek"),
  kabupatenAsal: z.string().min(2, "Kabupaten wajib diisi"),
  alasanMasukAsrama: z.string().min(30, "Alasan minimal 30 karakter"),
  preferensiKamar: z.enum(["putra", "putri"], {
    required_error: "Pilih preferensi kamar",
  }),
});

const kontakDaruratSchema = z.object({
  namaOrtu: z.string().min(3, "Nama wajib diisi"),
  hubunganOrtu: z.string().min(2, "Hubungan wajib diisi"),
  noHpOrtu: z.string().min(10, "No HP tidak valid").max(15),
});

type BiodataData = z.infer<typeof biodataSchema>;
type AkademikData = z.infer<typeof akademikSchema>;
type KontakData = z.infer<typeof kontakSchema>;
type KontakDaruratData = z.infer<typeof kontakDaruratSchema>;

const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const GOLDAR = ["A", "B", "AB", "O", "Tidak Tahu"];

const STEPS = [
  { num: 1, label: "Biodata", icon: User },
  { num: 2, label: "Akademik", icon: BookOpen },
  { num: 3, label: "Kontak", icon: MapPin },
  { num: 4, label: "Darurat", icon: Phone },
  { num: 5, label: "Berkas", icon: FileImage },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DaftarPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // KTP image disimpan sebagai base64 — wajib ada sebelum lanjut step 2
  const [ktpImage, setKtpImage] = useState<string | null>(null);
  // Cek kapasitas kamar — null = loading, 0 = penuh, >0 = ada slot
  const [kamarSlot, setKamarSlot] = useState<number | null>(null);
  // Berkas tambahan step 5 (semua opsional)
  const [fotoPas, setFotoPas] = useState<string | null>(null);
  const [ktmImage, setKtmImage] = useState<string | null>(null);
  const [suratKet, setSuratKet] = useState<string | null>(null);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const { userProfile } = useAuth();
  const dashboardHref =
    userProfile?.role === "admin" ? "/admin/dashboard" : "/mahasiswa/dashboard";

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cek kapasitas kamar saat halaman dibuka — kalau penuh, blokir pendaftaran
  React.useEffect(() => {
    getDocs(collection(db, "kamar"))
      .then((snap) => {
        const total = snap.docs.reduce((sum, d) => {
          const k = d.data() as { kapasitas?: number; terisi?: number; status?: string };
          if (k.status === "perawatan") return sum;
          return sum + Math.max(0, (k.kapasitas ?? 0) - (k.terisi ?? 0));
        }, 0);
        setKamarSlot(total);
      })
      .catch((err) => {
        console.warn("Gagal cek kapasitas kamar:", err);
        // Kalau gagal cek, default biarkan bisa daftar (cek ulang saat submit)
        setKamarSlot(999);
      });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // ── KTP auto-fill ──────────────────────────────────────────────────────────

  const handleKTPResult = (data: KTPData, imageBase64: string) => {
    setKtpImage(imageBase64);
    if (data.namaLengkap) biodataForm.setValue("namaLengkap", data.namaLengkap, { shouldValidate: true });
    if (data.nik) biodataForm.setValue("nik", data.nik, { shouldValidate: true });
    if (data.tempatLahir) biodataForm.setValue("tempatLahir", data.tempatLahir, { shouldValidate: true });
    if (data.tanggalLahir) biodataForm.setValue("tanggalLahir", data.tanggalLahir, { shouldValidate: true });
    if (data.jenisKelamin) biodataForm.setValue("jenisKelamin", data.jenisKelamin, { shouldValidate: true });
    if (data.agama) biodataForm.setValue("agama", data.agama, { shouldValidate: true });
    if (data.golonganDarah) biodataForm.setValue("golonganDarah", data.golonganDarah, { shouldValidate: true });
    // alamat dari KTP ke step 3
    if (data.alamatAsal) kontakForm.setValue("alamatAsal", data.alamatAsal, { shouldValidate: false });
    if (data.kabupatenAsal) kontakForm.setValue("kabupatenAsal", data.kabupatenAsal, { shouldValidate: false });
  };

  // ── Step handlers ──────────────────────────────────────────────────────────

  const onBiodata = (data: BiodataData) => {
    if (!ktpImage) {
      error("Upload foto KTP wajib sebelum lanjut.");
      return;
    }
    setBiodata(data);
    setStep(2);
  };
  const onAkademik = (data: AkademikData) => { setAkademik(data); setStep(3); };
  const onKontak = (data: KontakData) => { setKontak(data); setStep(4); };

  // Step 4 → cukup simpan data + lanjut ke step 5 (berkas + submit)
  const onKontakDarurat = (data: KontakDaruratData) => {
    setKontakDarurat(data);
    setStep(5);
  };

  // Step 5 (Berkas) → submit final langsung ke Firestore (client-side).
  // Tidak via API route karena Firebase client SDK tidak reliable di Node.js runtime.
  const handleSubmitFinal = async () => {
    if (!biodata || !akademik || !kontak || !kontakDarurat) return;
    if (!ktpImage) {
      error("Foto KTP wajib di-upload. Silakan kembali ke step 1.");
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      // Safety check: pastikan masih ada kamar tersedia saat submit
      try {
        const kamarSnap = await getDocs(collection(db, "kamar"));
        const slotTersisa = kamarSnap.docs.reduce((sum, d) => {
          const k = d.data() as { kapasitas?: number; terisi?: number; status?: string };
          if (k.status === "perawatan") return sum;
          return sum + Math.max(0, (k.kapasitas ?? 0) - (k.terisi ?? 0));
        }, 0);
        if (slotTersisa === 0) {
          error("Pendaftaran ditutup — semua kamar sudah penuh.");
          setKamarSlot(0);
          setSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn("Cek kapasitas saat submit gagal (lanjut):", err);
      }

      // Cek duplikat NIK & email (best-effort — kalau gagal lanjut create)
      try {
        const [nikSnap, emailSnap] = await Promise.all([
          getDocs(query(collection(db, "pendaftaran"), where("nik", "==", biodata.nik))),
          getDocs(query(collection(db, "pendaftaran"), where("email", "==", kontak.email))),
        ]);
        const activeStatus = (s: string) => s === "submitted" || s === "diverifikasi" || s === "diterima";

        const nikBlocked = nikSnap.docs.find((d) => activeStatus(d.data().status as string));
        if (nikBlocked) {
          error("NIK ini sudah pernah mendaftar dan sedang/sudah diproses.");
          setSubmitting(false);
          return;
        }

        const emailBlocked = emailSnap.docs.find((d) => activeStatus(d.data().status as string));
        if (emailBlocked) {
          error("Email ini sudah pernah dipakai untuk mendaftar. Gunakan email lain.");
          setSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn("Cek duplikat NIK/email gagal (lanjut):", err);
      }

      const now = Timestamp.now();
      await addDoc(collection(db, "pendaftaran"), {
        userId: null,
        status: "submitted",
        namaLengkap: biodata.namaLengkap,
        nik: biodata.nik,
        tempatLahir: biodata.tempatLahir,
        tanggalLahir: biodata.tanggalLahir,
        jenisKelamin: biodata.jenisKelamin,
        agama: biodata.agama,
        golonganDarah: biodata.golonganDarah || "Tidak Tahu",
        email: kontak.email,
        noHp: kontak.noHp,
        alamatAsal: kontak.alamatAsal,
        kabupatenAsal: kontak.kabupatenAsal,
        alasanMasukAsrama: kontak.alasanMasukAsrama,
        preferensiKamar: kontak.preferensiKamar,
        nim: akademik.nim,
        universitas: akademik.universitas,
        fakultas: akademik.fakultas,
        jurusan: akademik.jurusan,
        semester: akademik.semester,
        ipk: akademik.ipk || "-",
        namaOrtu: kontakDarurat.namaOrtu,
        hubunganOrtu: kontakDarurat.hubunganOrtu,
        noHpOrtu: kontakDarurat.noHpOrtu,
        ktpUrl: ktpImage,
        ...(fotoPas ? { fotoUrl: fotoPas } : {}),
        ...(ktmImage ? { ktmUrl: ktmImage } : {}),
        ...(suratKet ? { suratKeteranganUrl: suratKet } : {}),
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
      });

      success("Pendaftaran berhasil dikirim!");
      setDone(true);
    } catch (err) {
      console.error("Submit pendaftaran gagal:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("permission")) {
        error("Tidak diizinkan menyimpan. Hubungi admin.");
      } else if (msg.includes("offline") || msg.includes("unavailable")) {
        error("Tidak ada koneksi internet. Periksa jaringan Anda.");
      } else {
        error("Gagal mengirim pendaftaran. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Done screen ────────────────────────────────────────────────────────────

  // Block kalau kamar full — sebelum render form
  if (kamarSlot === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pendaftaran Ditutup Sementara</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Mohon maaf, saat ini <b>semua kamar asrama sudah penuh</b>.
              Pendaftaran akan dibuka kembali bila ada kamar yang kosong.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-left">
            <p className="text-xs font-bold text-amber-800 leading-relaxed">
              Anda bisa menghubungi pengurus asrama secara langsung untuk
              menanyakan ketersediaan kamar atau masuk daftar tunggu.
            </p>
          </div>
          <Button onClick={() => router.push("/")} className="px-10 py-4 rounded-2xl font-bold">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pendaftaran Terkirim!</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Data Anda sedang menunggu seleksi admin. Anda akan dihubungi melalui email{" "}
              <span className="font-bold text-primary-600">{kontak?.email}</span> apabila diterima.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-left space-y-3">
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Langkah Selanjutnya</p>
            <ul className="space-y-2 text-sm text-amber-800 font-medium">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                Admin akan meninjau pendaftaran & ketersediaan kamar (1-3 hari kerja).
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                Hasil seleksi (diterima / ditolak) akan dikirim ke email Anda.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                Bila <b>diterima</b>, kredensial login (email & password) akan disertakan di email tsb.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                Ada pertanyaan? Hubungi pengurus asrama langsung.
              </li>
            </ul>
          </div>

          <div className="flex justify-center pt-2">
            <Button onClick={() => router.push("/")} className="px-10 py-4 rounded-2xl font-bold">
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
        const isDone = step > s.num;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? "bg-green-500 text-white"
                    : active
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${
                  active ? "text-primary-600" : isDone ? "text-green-600" : "text-slate-400"
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

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar dari Halaman Utama */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Asrama Mahasiswa Jambi"
              className="w-11 h-11 object-contain"
            />
            <div className="leading-tight">
              <p className="font-extrabold text-slate-900 text-base tracking-tight">
                Asrama Mahasiswa Jambi
              </p>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">
                Jakarta
              </p>
            </div>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <Link
              href="/#fitur"
              className="hover:text-primary-600 transition-colors"
            >
              Fitur
            </Link>
            <Link
              href="/#cara-daftar"
              className="hover:text-primary-600 transition-colors"
            >
              Panduan
            </Link>
            <Link
              href="/#fasilitas"
              className="hover:text-primary-600 transition-colors"
            >
              Fasilitas
            </Link>
            <Link
              href="/peraturan"
              className="hover:text-primary-600 transition-colors"
            >
              Tata Tertib
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {userProfile ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white text-sm font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-premium hover:scale-[1.02] active:scale-[0.98]"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2.5 text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="px-8 py-3 bg-primary-600 text-white text-sm font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-premium hover:scale-[1.02] active:scale-[0.98]"
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 px-6 py-6 space-y-4 bg-white/95 backdrop-blur-md animate-in slide-in-bottom">
            <Link
              href="/#fitur"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fitur
            </Link>
            <Link
              href="/#cara-daftar"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Panduan
            </Link>
            <Link
              href="/#fasilitas"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fasilitas
            </Link>
            <Link
              href="/peraturan"
              className="block text-base font-bold text-slate-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tata Tertib
            </Link>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              {userProfile ? (
                <Link
                  href={dashboardHref}
                  className="flex-1 py-3.5 text-center text-sm font-bold bg-primary-600 text-white rounded-2xl shadow-premium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ke Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex-1 py-3.5 text-center text-sm font-bold border-2 border-slate-100 rounded-2xl text-slate-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/daftar"
                    className="flex-1 py-3.5 text-center text-sm font-bold bg-primary-600 text-white rounded-2xl shadow-premium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="flex-1 flex items-start justify-center p-4 py-10">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Formulir Pendaftaran Asrama</h1>
            <p className="text-slate-500 font-medium mt-2">
              Isi data dengan lengkap dan benar. Admin akan meninjau dan menghubungi Anda via email.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <Progress />

            {/* ── STEP 1: BIODATA ─────────────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={biodataForm.handleSubmit(onBiodata)} className="space-y-5">
                <SectionTitle icon={User} title="Biodata Pribadi" />

                {/* KTP Scanner — WAJIB */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    Foto KTP <span className="text-rose-500">*</span>
                    <span className="text-slate-400 normal-case font-medium ml-2">(wajib · biodata otomatis terisi)</span>
                  </label>
                  <KTPScannerPublic onResult={handleKTPResult} />
                  {ktpImage ? (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Foto KTP tersimpan
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Upload foto KTP dulu — wajib sebelum lanjut
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
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
                      Golongan Darah <span className="text-slate-400 normal-case font-medium">(opsional)</span>
                    </label>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                      {...biodataForm.register("golonganDarah")}
                    >
                      <option value="">-- Tidak Tahu / Pilih --</option>
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
                <NavButtons onBack={() => {}} isFirst loading={false} disabled={!ktpImage} />
              </form>
            )}

            {/* ── STEP 2: AKADEMIK ────────────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={akademikForm.handleSubmit(onAkademik)} className="space-y-5">
                <SectionTitle icon={BookOpen} title="Data Akademik" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input
                    label="NIM"
                    placeholder="Nomor Induk Mahasiswa"
                    required
                    error={akademikForm.formState.errors.nim?.message}
                    {...akademikForm.register("nim")}
                  />
                  <div>
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
                    placeholder="3.75 — kosongkan jika MABA"
                    helperText="Opsional. Mahasiswa baru semester 1 boleh dikosongkan."
                    error={akademikForm.formState.errors.ipk?.message}
                    {...akademikForm.register("ipk")}
                  />
                </div>
                <NavButtons onBack={() => setStep(1)} loading={false} />
              </form>
            )}

            {/* ── STEP 3: KONTAK ──────────────────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={kontakForm.handleSubmit(onKontak)} className="space-y-5">
                <SectionTitle icon={MapPin} title="Kontak & Alamat" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  <Input
                    label="Kabupaten/Kota Asal"
                    placeholder="Contoh: Kota Jambi"
                    required
                    error={kontakForm.formState.errors.kabupatenAsal?.message}
                    {...kontakForm.register("kabupatenAsal")}
                  />
                  <div className="md:col-span-3">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Alamat Asal Lengkap <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
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
                  <div className="md:col-span-3">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Preferensi Kamar <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3 max-w-sm">
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
                  <div className="md:col-span-3">
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
                <NavButtons onBack={() => setStep(2)} loading={false} />
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

                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex gap-3">
                  <Mail className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-primary-700 uppercase tracking-widest">Notifikasi Hasil</p>
                    <p className="text-xs text-primary-700 mt-1">
                      Hasil seleksi akan dikirim ke email <span className="font-bold">{kontak?.email}</span>.
                      Jika diterima, kredensial login akan disertakan di email tersebut.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ringkasan Pendaftaran</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 font-medium">
                    <span className="text-slate-400">Nama</span>
                    <span className="font-bold">{biodata?.namaLengkap}</span>
                    <span className="text-slate-400">Universitas</span>
                    <span className="font-bold">{akademik?.universitas}</span>
                    <span className="text-slate-400">Email</span>
                    <span className="font-bold">{kontak?.email}</span>
                    <span className="text-slate-400">Preferensi Kamar</span>
                    <span className="font-bold capitalize">{kontak?.preferensiKamar}</span>
                  </div>
                </div>

                <NavButtons onBack={() => setStep(3)} loading={false} />
              </form>
            )}

            {/* ── STEP 5: BERKAS PENDUKUNG (submit final) ───────────────── */}
            {step === 5 && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSubmitFinal(); }}
                className="space-y-5"
              >
                <SectionTitle icon={FileImage} title="Upload Berkas Pendukung" />

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Foto KTP sudah Anda upload di Step 1. Berkas tambahan berikut <b>opsional</b> —
                    boleh dilewati dan dikirim belakangan setelah pendaftaran diterima.
                    Max 3 MB per file (JPG/PNG/WebP).
                  </p>
                </div>

                <BerkasUpload
                  label="Foto Pas (3×4)"
                  helper="Foto formal terbaru, latar polos."
                  icon={<Camera className="w-5 h-5" />}
                  value={fotoPas}
                  onChange={setFotoPas}
                  onError={(m) => error(m)}
                />

                <BerkasUpload
                  label="Kartu Tanda Mahasiswa (KTM)"
                  helper="Scan/foto KTM aktif dari kampus."
                  icon={<FileTextIcon className="w-5 h-5" />}
                  value={ktmImage}
                  onChange={setKtmImage}
                  onError={(m) => error(m)}
                />

                <BerkasUpload
                  label="Surat Keterangan Aktif Kuliah"
                  helper="Surat resmi dari fakultas (opsional)."
                  icon={<Upload className="w-5 h-5" />}
                  value={suratKet}
                  onChange={setSuratKet}
                  onError={(m) => error(m)}
                />

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
                    <span className="text-slate-400">KTP</span>
                    <span className="font-bold text-emerald-600">✓ Terupload</span>
                    <span className="text-slate-400">Berkas Tambahan</span>
                    <span className="font-bold">
                      {[fotoPas, ktmImage, suratKet].filter(Boolean).length}/3
                    </span>
                  </div>
                </div>

                <NavButtons onBack={() => setStep(4)} loading={submitting} isLast />
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

      {/* Footer dari Halaman Utama */}
      <footer className="bg-slate-50 pt-24 pb-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <img
                  src="/logo.png"
                  alt="Asrama Jambi"
                  className="w-11 h-11 object-contain"
                />
                <span className="font-extrabold text-slate-900 text-xl tracking-tight uppercase">
                  Asrama Jambi App
                </span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                Sistem pendaftaran dan pengelolaan asrama mahasiswa Provinsi
                Jambi di Jakarta yang modern, efisien, dan transparan.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold mb-8 text-sm uppercase tracking-widest">
                Tautan Cepat
              </h4>
              <ul className="space-y-4 font-bold text-sm text-slate-500">
                <li>
                  <Link
                    href="/daftar"
                    className="text-primary-600 transition-colors"
                  >
                    Pendaftaran
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Akses Akun
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#fitur"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Informasi Fitur
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#fasilitas"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Fasilitas Umum
                  </Link>
                </li>
                <li>
                  <Link
                    href="/peraturan"
                    className="hover:text-primary-600 transition-colors"
                  >
                    Tata Tertib & Aturan
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold mb-8 text-sm uppercase tracking-widest">
                Hubungi Kami
              </h4>
              <ul className="space-y-5 font-bold text-sm text-slate-500">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 shrink-0 text-primary-500" />
                  <span>DKI Jakarta, Indonesia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-primary-500" />
                  <span>+62 (21) 0000-0000</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 shrink-0 text-primary-500" />
                  <span>hi@asramajambi.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-sm font-bold">
              © {new Date().getFullYear()} Asrama Mahasiswa Jambi Jakarta. Hak
              Cipta Dilindungi.
            </p>
            <div className="flex flex-wrap gap-6 md:gap-8 text-slate-400 font-bold text-sm">
              <Link
                href="/peraturan"
                className="hover:text-primary-600 transition-colors"
              >
                Tata Tertib
              </Link>
              <Link
                href="/privacy-policy"
                className="hover:text-primary-600 transition-colors"
              >
                Kebijakan Privasi
              </Link>
              <Link
                href="/terms-of-service"
                className="hover:text-primary-600 transition-colors"
              >
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Tombol Scroll to Top (SEO & Smooth Navigation) */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-primary-600 text-white shadow-premium hover:bg-primary-700 hover:scale-110 hover:-translate-y-1 transition-all duration-300 ${
          showScroll ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-6 h-6" />
      </button>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function BerkasUpload({
  label,
  helper,
  icon,
  value,
  onChange,
  onError,
}: {
  label: string;
  helper?: string;
  icon: React.ReactNode;
  value: string | null;
  onChange: (b64: string | null) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      onError(`${label}: ukuran maksimal 3 MB.`);
      return;
    }
    setBusy(true);
    try {
      const b64 = await fileToBase64(file, 1200, 0.8);
      onChange(b64);
    } catch (err) {
      console.error(err);
      onError(`${label}: gagal memproses file.`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
        {label}
        {helper && <span className="text-slate-400 normal-case font-medium ml-2">{helper}</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40">
          <img src={value} alt={label} className="w-16 h-16 rounded-xl object-cover border border-emerald-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Terupload
            </p>
            <p className="text-xs text-emerald-600 truncate">{label}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition"
            aria-label="Hapus"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary-400 hover:bg-primary-50/30 transition text-slate-500 hover:text-primary-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
          <span className="text-sm font-bold">{busy ? "Memproses..." : `Upload ${label}`}</span>
        </button>
      )}
    </div>
  );
}

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
  onBack,
  isFirst,
  isLast,
  loading,
  disabled,
}: {
  onBack: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  loading: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        className="flex-1 py-4 rounded-2xl font-bold shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
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
