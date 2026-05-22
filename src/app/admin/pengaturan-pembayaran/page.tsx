"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, Check, Loader2, Save, AlertTriangle, Upload, X } from "lucide-react";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/firestore";
import { fileToBase64 } from "@/lib/storage";
import {
  PAYMENT_METHODS,
  CATEGORY_LABEL,
  DEFAULT_ENABLED_METHODS,
  type PaymentCategory,
} from "@/lib/payment-methods";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const LOGO_MAX_SIZE = 128;
const LOGO_MAX_BYTES = 500 * 1024; // 500KB sebelum resize

export default function PengaturanPembayaranPage() {
  const { success, error } = useToast();
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMethodId, setActiveMethodId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const settings = await getPaymentSettings();
    setEnabled(new Set(settings.enabledMethods));
    setLogos(settings.methodLogos ?? {});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUploadClick = (methodId: string) => {
    setActiveMethodId(methodId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const methodId = activeMethodId;
    if (!file || !methodId) return;
    if (file.size > LOGO_MAX_BYTES) {
      error("Ukuran file maksimal 500KB.");
      return;
    }
    setUploadingFor(methodId);
    try {
      const dataURL = await fileToBase64(file, LOGO_MAX_SIZE, 0.9);
      setLogos((prev) => ({ ...prev, [methodId]: dataURL }));
      success(`Logo untuk ${methodId} di-upload. Klik Simpan untuk apply.`);
    } catch (err) {
      console.error(err);
      error("Gagal mengupload logo.");
    } finally {
      setUploadingFor(null);
      setActiveMethodId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = (methodId: string) => {
    setLogos((prev) => {
      const next = { ...prev };
      delete next[methodId];
      return next;
    });
  };

  const handleSave = async () => {
    if (enabled.size === 0) {
      error("Minimal 1 metode harus aktif.");
      return;
    }
    setSaving(true);
    try {
      await updatePaymentSettings(Array.from(enabled), logos);
      success("Pengaturan pembayaran tersimpan.");
    } catch (err) {
      console.error(err);
      error("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const resetDefault = () => {
    setEnabled(new Set(DEFAULT_ENABLED_METHODS));
  };

  const grouped = PAYMENT_METHODS.reduce<Record<PaymentCategory, typeof PAYMENT_METHODS>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<PaymentCategory, typeof PAYMENT_METHODS>);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Pembayaran</h1>
          <p className="text-slate-500 font-medium mt-1">
            Aktifkan metode pembayaran & upload logo custom (opsional).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            className="rounded-2xl font-bold border-slate-200"
            onClick={resetDefault}
            disabled={saving}
          >
            Reset Default
          </Button>
          <Button
            size="md"
            className="rounded-2xl font-bold"
            icon={<Save className="w-5 h-5" />}
            onClick={handleSave}
            loading={saving}
          >
            Simpan
          </Button>
        </div>
      </div>

      <div className="flex gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-100">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="font-bold text-amber-900 text-sm">Catatan</p>
          <p className="text-xs font-medium text-amber-800 leading-relaxed">
            Metode yang Anda aktifkan harus sudah <span className="font-bold">diaktifkan juga di Midtrans Dashboard</span>.
            Logo custom hanya tampil di modal pilih metode di app — popup Snap Midtrans tetap pakai logo standar mereka.
            Max file 500KB · format PNG/JPG/SVG/WebP · otomatis di-resize ke 128px.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.keys(grouped) as PaymentCategory[]).map((cat) => (
            <Card key={cat} className="overflow-hidden border-none shadow-sm rounded-[2rem] bg-white">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-primary-600" />
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  {CATEGORY_LABEL[cat]}
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {grouped[cat].map((m) => {
                  const active = enabled.has(m.id);
                  const customLogo = logos[m.id];
                  const isUploading = uploadingFor === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                        active ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Logo preview */}
                      <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                        {customLogo ? (
                          <img src={customLogo} alt={m.label} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-2xl">{m.icon}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{m.label}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{m.id}</p>
                        {m.note && (
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{m.note}</p>
                        )}
                      </div>

                      {/* Upload / Remove logo buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUploadClick(m.id)}
                          disabled={isUploading}
                          className="p-2 rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition disabled:opacity-50"
                          title="Upload logo"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </button>
                        {customLogo && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo(m.id)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                            title="Hapus logo custom"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() => toggle(m.id)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition shrink-0 ${
                          active ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            active ? "translate-x-6" : "translate-x-1"
                          }`}
                        >
                          {active && <Check className="w-3 h-3 text-emerald-500 m-1" />}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5 rounded-[2rem] border-none shadow-sm bg-slate-50">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
          Aktif: {enabled.size} metode
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from(enabled).map((id) => {
            const m = PAYMENT_METHODS.find((x) => x.id === id);
            if (!m) return null;
            const customLogo = logos[id];
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700"
              >
                {customLogo ? (
                  <img src={customLogo} alt="" className="w-4 h-4 object-contain" />
                ) : (
                  <span>{m.icon}</span>
                )}
                {m.label}
              </span>
            );
          })}
          {enabled.size === 0 && (
            <span className="text-xs text-rose-600 font-bold">Belum ada metode yang aktif!</span>
          )}
        </div>
      </Card>
    </div>
  );
}
