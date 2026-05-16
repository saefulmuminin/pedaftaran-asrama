"use client";

import React, { useRef, useState } from "react";
import { Upload, X, FileText, Image, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile, generateFilePath } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSizeMB?: number;
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  required?: boolean;
  type: string;
  error?: string;
}

export function FileUpload({
  label,
  accept = "image/*,application/pdf",
  maxSizeMB = 5,
  value,
  onChange,
  onClear,
  required,
  type,
  error,
}: FileUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState("");

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }
    setLocalError("");
    setUploading(true);
    try {
      const path = generateFilePath(user!.uid, type, file);
      const url = await uploadFile(file, path, setProgress);
      onChange(url);
    } catch {
      setLocalError("Gagal mengunggah file. Coba lagi.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {value ? (
        <div className="relative flex items-center gap-4 p-4 bg-primary-50 border border-primary-100 rounded-2xl">
          {isImage(value) ? (
            <Image className="w-10 h-10 text-primary-600" />
          ) : (
            <FileText className="w-10 h-10 text-primary-600" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-primary-900 font-bold">File berhasil diunggah</span>
            </div>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 font-medium hover:underline truncate block mt-0.5"
            >
              Lihat file
            </a>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
            uploading
              ? "border-primary-400 bg-primary-50"
              : "border-slate-200 hover:border-primary-400 hover:bg-primary-50"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-primary-600 font-bold">Mengunggah... {progress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-600">
                <span className="text-primary-600 font-bold">Klik untuk upload</span> atau drag & drop
              </p>
              <p className="text-xs text-slate-400 font-medium">
                {accept.includes("pdf") ? "JPG, PNG, PDF" : "JPG, PNG"} maks {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
      )}

      {(localError || error) && (
        <p className="text-xs text-red-500">{localError || error}</p>
      )}
    </div>
  );
}
