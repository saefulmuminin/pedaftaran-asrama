"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import {
  ArrowLeft, Copy, CheckCircle, Loader2, Clock, AlertTriangle,
  Wallet, RefreshCw, QrCode, Smartphone, Building2,
} from "lucide-react";
import {
  getTagihanById, updateTagihan, formatPeriode, getPaymentSettings,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Tagihan, StatusTagihan as StatusTagihanType } from "@/types";

interface ChargeResponse {
  orderId: string;
  status_code: string;
  transaction_id: string;
  payment_type: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  actions?: Array<{ name: string; method: string; url: string }>;
  qr_string?: string;
  expiry_time?: string;
  error?: string;
}

const POLL_INTERVAL_MS = 5000; // 5 detik

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function BayarTagihanPage() {
  const { tagihanId } = useParams<{ tagihanId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { success, error, info } = useToast();

  const [tagihan, setTagihan] = useState<Tagihan | null>(null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [methodLogos, setMethodLogos] = useState<Record<string, string>>({});
  const [charge, setCharge] = useState<ChargeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load tagihan + payment settings
  useEffect(() => {
    const load = async () => {
      if (!user?.uid || !tagihanId) return;
      const m = searchParams.get("method");
      setMethodId(m);
      try {
        const t = await getTagihanById(tagihanId);
        if (!t || t.userId !== user.uid) {
          error("Tagihan tidak ditemukan atau bukan milik Anda.");
          router.push("/mahasiswa/tagihan");
          return;
        }
        if (t.status === "lunas") {
          info("Tagihan ini sudah lunas.");
          router.push("/mahasiswa/tagihan");
          return;
        }
        setTagihan(t);
        const settings = await getPaymentSettings();
        setMethodLogos(settings.methodLogos ?? {});
      } catch (err) {
        console.error(err);
        error("Gagal memuat tagihan.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tagihanId, user?.uid, searchParams, error, info, router]);

  // Trigger charge sekali setelah tagihan & method loaded
  useEffect(() => {
    if (!tagihan || !methodId || !userProfile || charge || charging) return;
    const doCharge = async () => {
      setCharging(true);
      try {
        const res = await fetch("/api/midtrans/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tagihanId: tagihan.id,
            jumlah: tagihan.jumlah,
            judul: tagihan.judul ?? "Iuran Bulanan",
            periode: formatPeriode(tagihan.periode),
            namaLengkap: tagihan.namaLengkap,
            email: userProfile.email,
            method: methodId,
          }),
        });
        const json: ChargeResponse = await res.json();
        if (!res.ok) {
          error(json.error ?? "Gagal membuat transaksi.");
          return;
        }
        setCharge(json);

        // Simpan orderId ke tagihan untuk tracking
        try {
          await updateTagihan(tagihan.id, {
            midtransOrderId: json.orderId,
            status: "pending",
            paymentType: json.payment_type,
            expiredAt: json.expiry_time
              ? Timestamp.fromDate(new Date(json.expiry_time))
              : Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
          });
        } catch (err) {
          console.warn("Update tagihan gagal:", err);
        }
      } catch (err) {
        console.error("Charge gagal:", err);
        error("Gagal memproses pembayaran.");
      } finally {
        setCharging(false);
      }
    };
    doCharge();
  }, [tagihan, methodId, userProfile, charge, charging, error]);

  // Polling status setiap 5 detik
  useEffect(() => {
    if (!charge?.orderId || paid) return;

    const verify = async () => {
      try {
        const res = await fetch("/api/midtrans/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: charge.orderId }),
        });
        const json = await res.json() as { status?: StatusTagihanType; paymentType?: string };
        if (json.status === "lunas") {
          setPaid(true);
          await updateTagihan(tagihan!.id, {
            status: "lunas",
            paidAt: Timestamp.now(),
            ...(json.paymentType ? { paymentType: json.paymentType } : {}),
          });
          success("Pembayaran berhasil!");
        }
      } catch (err) {
        console.warn("Poll gagal:", err);
      }
    };

    verify();
    pollRef.current = setInterval(verify, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [charge?.orderId, paid, tagihan, success]);

  // Tick countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const copyToClipboard = (text: string, label = "Disalin") => {
    navigator.clipboard.writeText(text);
    success(label);
  };

  const method = methodId ? PAYMENT_METHODS.find((m) => m.id === methodId) : null;
  const expiryMs = charge?.expiry_time ? new Date(charge.expiry_time).getTime() : null;
  const countdownMs = expiryMs ? expiryMs - now : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading || !tagihan || !method) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat...</p>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
        <Card className="p-10 border-none shadow-premium rounded-[2.5rem] text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pembayaran Berhasil!</h1>
            <p className="text-slate-500 font-medium mt-2">
              Terima kasih, tagihan {tagihan.judul} untuk {formatPeriode(tagihan.periode)} sudah lunas.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Dibayar</p>
            <p className="text-3xl font-black text-emerald-700 mt-1">
              Rp {tagihan.jumlah.toLocaleString("id-ID")}
            </p>
          </div>
          <Link
            href="/mahasiswa/tagihan"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition"
          >
            Kembali ke Tagihan
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/mahasiswa/tagihan"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Memantau pembayaran...
        </div>
      </div>

      {/* Summary */}
      <Card className="p-6 md:p-8 border-none shadow-premium rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-primary-700 text-white mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Pembayaran</p>
        <p className="text-4xl md:text-5xl font-black mt-2">Rp {tagihan.jumlah.toLocaleString("id-ID")}</p>
        <div className="mt-4 pt-4 border-t border-white/20 text-sm font-bold opacity-90">
          {tagihan.judul ?? "Iuran Bulanan"} · {formatPeriode(tagihan.periode)} · Kamar {tagihan.nomorKamar}
        </div>
      </Card>

      {/* Method header */}
      <Card className="p-5 border-none shadow-sm rounded-[2rem] bg-white mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {methodLogos[method.id] ? (
              <img src={methodLogos[method.id]} alt={method.label} className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl">{method.icon}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Pembayaran</p>
            <p className="text-lg font-extrabold text-slate-900">{method.label}</p>
          </div>
          {countdownMs !== null && countdownMs > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Bayar dalam</p>
              <p className="text-base font-mono font-black text-amber-700 tabular-nums">
                {fmtCountdown(countdownMs)}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Charge loading */}
      {charging && (
        <Card className="p-12 border-none shadow-sm rounded-[2rem] text-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">Menyiapkan pembayaran...</p>
        </Card>
      )}

      {/* Payment instructions */}
      {charge && !charging && (
        <PaymentInstructions
          method={method.id}
          methodLabel={method.label}
          charge={charge}
          onCopy={copyToClipboard}
        />
      )}

      {/* Footer status */}
      <div className="mt-6 p-5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs font-medium text-amber-800 leading-relaxed">
          Halaman ini memantau pembayaran Anda otomatis setiap 5 detik. Setelah Anda berhasil bayar,
          status akan terupdate otomatis. <span className="font-bold">Jangan tutup halaman ini sebelum pembayaran selesai.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Payment instructions per metode ──────────────────────────

function PaymentInstructions({
  method, methodLabel, charge, onCopy,
}: {
  method: string;
  methodLabel: string;
  charge: ChargeResponse;
  onCopy: (text: string, label?: string) => void;
}) {
  // GoPay / ShopeePay — QR code dari actions
  if (method === "gopay" || method === "shopeepay") {
    const qrAction = charge.actions?.find((a) => a.name === "generate-qr-code");
    const deeplink = charge.actions?.find((a) => a.name === "deeplink-redirect");
    return (
      <Card className="p-6 md:p-8 border-none shadow-sm rounded-[2rem] bg-white">
        <div className="flex items-center gap-3 mb-6">
          <QrCode className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-extrabold text-slate-900">Scan QR Code</h2>
        </div>
        {qrAction ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white border-2 border-slate-200 rounded-3xl">
              <img src={qrAction.url} alt="QR Code" className="w-64 h-64 object-contain" />
            </div>
            <p className="text-sm font-bold text-slate-700 text-center">
              Buka aplikasi {methodLabel} → scan QR di atas → konfirmasi pembayaran.
            </p>
            {deeplink && (
              <a
                href={deeplink.url}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition md:hidden"
              >
                <Smartphone className="w-4 h-4" />
                Buka Aplikasi {methodLabel}
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 font-medium">QR code tidak tersedia.</p>
        )}
      </Card>
    );
  }

  // Mandiri Bill Payment (echannel)
  if (method === "echannel") {
    return (
      <Card className="p-6 md:p-8 border-none shadow-sm rounded-[2rem] bg-white space-y-5">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-extrabold text-slate-900">Mandiri Bill Payment</h2>
        </div>

        <CopyableField
          label="Biller Code"
          value={charge.biller_code ?? "—"}
          onCopy={(v) => onCopy(v, "Biller Code disalin")}
        />
        <CopyableField
          label="Bill Key"
          value={charge.bill_key ?? "—"}
          mono
          onCopy={(v) => onCopy(v, "Bill Key disalin")}
        />

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
            Cara Bayar (ATM Mandiri)
          </p>
          <ol className="text-xs font-medium text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Masuk menu <b>Bayar / Beli</b> → <b>Multipayment</b>.</li>
            <li>Masukkan kode perusahaan: <b>{charge.biller_code}</b></li>
            <li>Masukkan kode bayar (Bill Key): <b>{charge.bill_key}</b></li>
            <li>Konfirmasi pembayaran.</li>
          </ol>
        </div>
      </Card>
    );
  }

  // Virtual Account (BCA, BNI, BRI, Permata)
  if (method.endsWith("_va")) {
    const bankName = method.replace("_va", "").toUpperCase();
    const vaNumber = charge.va_numbers?.[0]?.va_number ?? charge.permata_va_number ?? "—";
    return (
      <Card className="p-6 md:p-8 border-none shadow-sm rounded-[2rem] bg-white space-y-5">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-extrabold text-slate-900">{bankName} Virtual Account</h2>
        </div>

        <CopyableField
          label="Nomor Virtual Account"
          value={vaNumber}
          mono
          large
          onCopy={(v) => onCopy(v, "Nomor VA disalin")}
        />

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
            Cara Bayar
          </p>
          <ol className="text-xs font-medium text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Buka aplikasi mobile banking {bankName}, atau ATM {bankName}.</li>
            <li>Pilih menu <b>Transfer</b> → <b>Virtual Account</b>.</li>
            <li>Masukkan nomor VA di atas.</li>
            <li>Konfirmasi nominal & nama → bayar.</li>
            <li>Selesai. Halaman ini akan otomatis update saat pembayaran masuk.</li>
          </ol>
        </div>
      </Card>
    );
  }

  // Fallback
  return (
    <Card className="p-8 border-none shadow-sm rounded-[2rem] text-center">
      <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-bold text-slate-600">
        Metode pembayaran ini belum punya tampilan custom.
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Order ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{charge.orderId}</code>
      </p>
    </Card>
  );
}

function CopyableField({
  label, value, mono, large, onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  large?: boolean;
  onCopy: (v: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 px-5 py-4 rounded-2xl border-2 border-slate-200 bg-slate-50 ${
            large ? "text-2xl" : "text-base"
          } font-extrabold text-slate-900 ${mono ? "font-mono tracking-wider" : ""} break-all`}
        >
          {value}
        </div>
        <button
          onClick={() => {
            onCopy(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className={`p-4 rounded-2xl transition border-2 ${
            copied
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-slate-500 border-slate-200 hover:border-primary-400 hover:text-primary-600"
          }`}
          title="Salin"
        >
          {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
