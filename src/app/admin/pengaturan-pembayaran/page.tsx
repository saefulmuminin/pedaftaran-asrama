"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CreditCard, Check, Loader2, Save, AlertTriangle } from "lucide-react";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/firestore";
import {
  PAYMENT_METHODS,
  CATEGORY_LABEL,
  DEFAULT_ENABLED_METHODS,
  type PaymentCategory,
} from "@/lib/payment-methods";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function PengaturanPembayaranPage() {
  const { success, error } = useToast();
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const settings = await getPaymentSettings();
    setEnabled(new Set(settings.enabledMethods));
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

  const handleSave = async () => {
    if (enabled.size === 0) {
      error("Minimal 1 metode harus aktif.");
      return;
    }
    setSaving(true);
    try {
      await updatePaymentSettings(Array.from(enabled));
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

  // Group by category
  const grouped = PAYMENT_METHODS.reduce<Record<PaymentCategory, typeof PAYMENT_METHODS>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<PaymentCategory, typeof PAYMENT_METHODS>);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Pembayaran</h1>
          <p className="text-slate-500 font-medium mt-1">
            Aktifkan metode yang boleh dipilih mahasiswa saat membayar tagihan.
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
            Aktif di sini tapi tidak di Midtrans → Snap akan tetap menolaknya.
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
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${
                        active ? "bg-emerald-50/40 hover:bg-emerald-50/60" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="text-2xl shrink-0 w-10 text-center">{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{m.label}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{m.id}</p>
                        {m.note && (
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{m.note}</p>
                        )}
                      </div>
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
                    </label>
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
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700"
              >
                <span>{m.icon}</span> {m.label}
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
