"use client";

import React, { useRef, useState } from "react";
import { ScanLine, CheckCircle, RefreshCw, AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile, generateFilePath } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

export interface KTPData {
  nik?: string;
  namaLengkap?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: "L" | "P";
  agama?: string;
  alamatAsal?: string;
  kabupatenAsal?: string;
  ktpUrl?: string;
}

interface KTPScannerProps {
  onResult: (data: KTPData) => void;
  ktpUrl?: string;
  onClear?: () => void;
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

function extractKabupaten(text: string): string {
  const list = [
    "KOTA JAMBI","BATANGHARI","BUNGO","KERINCI","MERANGIN","MUARO JAMBI",
    "SAROLANGUN","SUNGAI PENUH","TANJUNG JABUNG BARAT","TANJUNG JABUNG TIMUR","TEBO",
  ];
  for (const k of list) {
    if (text.includes(k)) return k.charAt(0) + k.slice(1).toLowerCase();
  }
  return "";
}

function parseKTPText(rawText: string): KTPData {
  const text = rawText.replace(/[|}{[\]\\]/g, " ").replace(/\s+/g, " ").toUpperCase();
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result: KTPData = {};

  // NIK: 16 digit
  const nikMatch = text.match(/\b(\d{16})\b/);
  if (nikMatch) result.nik = nikMatch[1];

  // Nama
  for (const line of lines) {
    const m = line.match(/NAMA\s*[:.]*\s*([A-Z\s]{3,40})/);
    if (m) {
      result.namaLengkap = m[1].trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      break;
    }
  }

  // Tempat/Tgl Lahir
  for (const line of lines) {
    const m = line.match(/(?:TEMPAT[/,]?\s*TGL|LAHIR)[^A-Z]*([A-Z\s]{2,25})[,/]\s*(\d{2}[-./]\d{2}[-./]\d{4})/i);
    if (m) {
      result.tempatLahir = m[1].trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      result.tanggalLahir = parseDate(m[2]);
      break;
    }
  }

  // Jenis Kelamin
  if (text.includes("LAKI-LAKI") || text.includes("LAKI LAKI")) result.jenisKelamin = "L";
  else if (text.includes("PEREMPUAN")) result.jenisKelamin = "P";

  // Agama
  for (const ag of ["ISLAM","KRISTEN","KATOLIK","HINDU","BUDDHA","KONGHUCU"]) {
    if (text.includes(ag)) { result.agama = ag.charAt(0) + ag.slice(1).toLowerCase(); break; }
  }

  // Alamat
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^ALAMAT\s*[:.]*\s*(.{3,})/);
    if (m) {
      result.alamatAsal = m[1].trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      break;
    }
  }

  // Kabupaten
  result.kabupatenAsal = extractKabupaten(text);

  return result;
}

export function KTPScanner({ onResult, ktpUrl, onClear }: KTPScannerProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "scanning" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [extractedData, setExtractedData] = useState<KTPData | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setStatus("error"); return; }
    setPreviewUrl(URL.createObjectURL(file));
    try {
      setStatus("uploading"); setProgressMsg("Mengunggah KTP..."); setProgress(5);
      const path = generateFilePath(user!.uid, "ktp", file);
      const url = await uploadFile(file, path, p => setProgress(5 + Math.round(p * 0.25)));

      setStatus("scanning"); setProgressMsg("Memproses OCR..."); setProgress(30);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("ind+eng", 1, {
        logger: m => {
          if (m.status === "recognizing text") {
            setProgress(30 + Math.round(m.progress * 60));
            setProgressMsg(`Membaca KTP... ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      setProgress(95); setProgressMsg("Menganalisis data...");
      const parsed = parseKTPText(data.text);
      parsed.ktpUrl = url;
      setExtractedData(parsed);
      setStatus("done"); setProgress(100);
      onResult(parsed);
    } catch (e) {
      console.error("KTP OCR error:", e);
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle"); setProgress(0); setProgressMsg("");
    setPreviewUrl(""); setExtractedData(null);
    onClear?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  if (status === "idle" && !ktpUrl) {
    return (
      <div
        className="border-2 border-dashed border-primary-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-all"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ScanLine className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-sm font-bold text-slate-700">Upload foto KTP untuk scan otomatis</p>
        <p className="text-xs text-slate-400 mt-1">JPG, PNG — foto harus jelas dan tidak buram</p>
        <p className="text-[10px] text-primary-500 font-medium mt-2">⚡ AI akan mengisi form secara otomatis</p>
      </div>
    );
  }

  if (status === "uploading" || status === "scanning") {
    return (
      <div className="border-2 border-primary-200 rounded-2xl p-5 bg-primary-50/30 space-y-3">
        {previewUrl && <img src={previewUrl} alt="KTP" className="w-full max-h-36 object-cover rounded-xl border border-primary-100" />}
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
          <p className="text-sm font-bold text-primary-700">{progressMsg}</p>
        </div>
        <div className="w-full bg-primary-100 rounded-full h-2 overflow-hidden">
          <div className="bg-primary-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
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
          <p className="text-xs text-red-500 mt-0.5">Gunakan foto yang lebih jelas, atau isi form manual.</p>
        </div>
        <button onClick={reset} className="text-red-400 hover:text-red-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === "done" && extractedData) {
    const filled = Object.entries(extractedData).filter(([k, v]) => k !== "ktpUrl" && v).length;
    return (
      <div className="border-2 border-emerald-200 rounded-2xl p-5 bg-emerald-50/40 space-y-3">
        {previewUrl && <img src={previewUrl} alt="KTP" className="w-full max-h-32 object-cover rounded-xl border border-emerald-100" />}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-800">KTP berhasil dibaca!</p>
              <p className="text-xs text-emerald-600">{filled} field diisi otomatis</p>
            </div>
          </div>
          <button onClick={reset} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg" title="Scan ulang">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { label: "NIK", val: extractedData.nik },
            { label: "Nama", val: extractedData.namaLengkap },
            { label: "Tempat Lahir", val: extractedData.tempatLahir },
            { label: "Jenis Kelamin", val: extractedData.jenisKelamin === "L" ? "Laki-laki" : extractedData.jenisKelamin === "P" ? "Perempuan" : undefined },
            { label: "Agama", val: extractedData.agama },
          ].map(({ label, val }) => (
            <div key={label} className={cn(!val && "opacity-40")}>
              <span className="text-slate-400">{label}: </span>
              <span className="font-bold text-slate-700">{val || "—"}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400">Periksa dan koreksi data di form jika ada yang kurang tepat.</p>
      </div>
    );
  }

  // ktpUrl ada tapi belum scan (mode edit)
  return (
    <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-emerald-50/40 flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-bold text-emerald-800">KTP sudah diunggah</p>
        <a href={ktpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">Lihat file</a>
      </div>
      {onClear && (
        <button onClick={reset} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
      )}
    </div>
  );
}
