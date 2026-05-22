"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Wallet, CheckCircle, Clock, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import {
  getTagihanByUser, formatPeriode, getCurrentPeriode, updateTagihan, getPaymentSettings,
} from "@/lib/firestore";
import { PAYMENT_METHODS, CATEGORY_LABEL, type PaymentCategory, type PaymentMethodDef } from "@/lib/payment-methods";
import { Modal } from "@/components/ui/Modal";
import type { StatusTagihan as StatusTagihanType } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Tagihan, StatusTagihan } from "@/types";

const MIDTRANS_SNAP_URL = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

const CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";

const STATUS_META: Record<StatusTagihan, { label: string; color: string; Icon: React.ElementType }> = {
  unpaid: { label: "Belum Bayar", color: "bg-amber-50 text-amber-700 border-amber-200", Icon: AlertTriangle },
  pending: { label: "Menunggu Pembayaran", color: "bg-sky-50 text-sky-700 border-sky-200", Icon: Clock },
  lunas: { label: "Lunas", color: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-600 border-slate-200", Icon: XCircle },
  cancelled: { label: "Dibatalkan", color: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle },
};

interface SnapWindow extends Window {
  snap?: {
    pay: (token: string, opts: {
      onSuccess?: (result: { order_id: string }) => void;
      onPending?: (result: { order_id: string }) => void;
      onError?: (result: unknown) => void;
      onClose?: () => void;
    }) => void;
  };
}

export default function MahasiswaTagihanPage() {
  const { user, userProfile } = useAuth();
  const { success, error, info } = useToast();
  const [data, setData] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const redirectHandledRef = useRef(false);

  // Method selection modal state
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState<Tagihan | null>(null);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethodDef[]>([]);
  const [methodLogos, setMethodLogos] = useState<Record<string, string>>({});
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [loadingMethods, setLoadingMethods] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    const list = await getTagihanByUser(user.uid);
    // Mahasiswa hanya boleh lihat tagihan bulan ini & sebelumnya.
    // Tagihan periode mendatang (admin pre-generate) disembunyikan sampai bulan tsb tiba.
    const current = getCurrentPeriode();
    setData(list.filter((t) => t.periode <= current));
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => { load(); }, [load]);

  // Verifikasi status pembayaran ke Midtrans (via API route), lalu update
  // tagihan doc di Firestore dari client (yang punya auth context).
  const verifyPayment = useCallback(async (orderId: string, tagihanId: string) => {
    try {
      const res = await fetch("/api/midtrans/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json() as {
        status?: StatusTagihanType;
        paymentType?: string;
        error?: string;
      };
      if (!res.ok || !json.status) {
        console.warn("Verify payment response error:", json.error);
        return;
      }
      // Update Firestore dari client
      await updateTagihan(tagihanId, {
        status: json.status,
        ...(json.paymentType ? { paymentType: json.paymentType } : {}),
        ...(json.status === "lunas" ? { paidAt: Timestamp.now() } : {}),
      });
    } catch (err) {
      console.warn("Verify payment gagal:", err);
    }
  }, []);

  // Handler untuk Midtrans finish/unfinish/error redirect.
  // Midtrans menambahkan order_id ke URL, kita juga set ?status=success|pending|error
  // di dashboard Midtrans → Configuration → Redirect URL.
  useEffect(() => {
    if (redirectHandledRef.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status");
    const orderId = params.get("order_id");
    const transactionStatus = params.get("transaction_status");

    // Tidak ada redirect param sama sekali → skip
    if (!statusParam && !orderId && !transactionStatus) return;
    redirectHandledRef.current = true;

    const sync = async () => {
      // Sync status: cari tagihan yang midtransOrderId match
      if (orderId) {
        const list = await getTagihanByUser(user?.uid ?? "");
        const match = list.find((t) => t.midtransOrderId === orderId);
        if (match) await verifyPayment(orderId, match.id);
      }

      // Toast berdasarkan status — utamakan transaction_status dari Midtrans
      const effective = transactionStatus ?? statusParam;
      switch (effective) {
        case "capture":
        case "settlement":
        case "success":
          success("Pembayaran berhasil! Tagihan Anda lunas.");
          break;
        case "pending":
          info("Pembayaran masih diproses. Status akan diperbarui otomatis.");
          break;
        case "deny":
        case "cancel":
        case "failure":
        case "error":
          error("Pembayaran gagal atau dibatalkan.");
          break;
        case "expire":
          error("Pembayaran kedaluwarsa. Silakan coba lagi.");
          break;
        default:
          info("Status pembayaran diperbarui.");
      }

      // Reload data tagihan + bersihkan URL agar tidak repeat saat refresh
      await load();
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    };

    sync();
  }, [verifyPayment, load, success, error, info]);

  // Step 1: User klik "Bayar" → load metode aktif dari settings, buka modal pilih metode.
  const openMethodModal = async (tagihan: Tagihan) => {
    setSelectedTagihan(tagihan);
    setSelectedMethodId("");
    setLoadingMethods(true);
    setMethodModalOpen(true);
    try {
      const settings = await getPaymentSettings();
      const enabled = PAYMENT_METHODS.filter((m) => settings.enabledMethods.includes(m.id));
      setAvailableMethods(enabled);
      setMethodLogos(settings.methodLogos ?? {});
      if (enabled.length === 1) setSelectedMethodId(enabled[0].id);
    } catch (err) {
      console.error("Load payment methods gagal:", err);
      error("Gagal memuat metode pembayaran.");
      setMethodModalOpen(false);
    } finally {
      setLoadingMethods(false);
    }
  };

  // Step 2: User pilih metode → call API dengan enabled_payments = [selected] → buka Snap popup.
  const handleConfirmPay = async () => {
    if (!selectedTagihan || !userProfile) return;
    if (!selectedMethodId) {
      error("Pilih metode pembayaran dulu.");
      return;
    }
    if (!CLIENT_KEY) {
      error("Midtrans Client Key belum dikonfigurasi.");
      return;
    }
    const tagihan = selectedTagihan;
    setPayingId(tagihan.id);
    setMethodModalOpen(false);
    try {
      const res = await fetch("/api/midtrans/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagihanId: tagihan.id,
          jumlah: tagihan.jumlah,
          judul: tagihan.judul ?? "Iuran Bulanan",
          periode: formatPeriode(tagihan.periode),
          namaLengkap: tagihan.namaLengkap,
          email: userProfile.email,
          enabledPayments: [selectedMethodId],
        }),
      });
      const json = await res.json() as { token?: string; orderId?: string; error?: string };
      if (!res.ok || !json.token || !json.orderId) {
        error(json.error ?? "Gagal membuat transaksi.");
        return;
      }

      try {
        await updateTagihan(tagihan.id, {
          midtransOrderId: json.orderId,
          midtransToken: json.token,
          status: "pending",
          expiredAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
        });
      } catch (err) {
        console.warn("Update tagihan gagal (lanjut bayar):", err);
      }

      const win = window as SnapWindow;
      if (!win.snap) {
        error("Midtrans Snap belum siap. Refresh halaman dan coba lagi.");
        return;
      }

      const orderId = json.orderId;
      win.snap.pay(json.token, {
        onSuccess: async (result) => {
          await verifyPayment(result.order_id, tagihan.id);
          success("Pembayaran berhasil!");
          await load();
        },
        onPending: async (result) => {
          await verifyPayment(result.order_id, tagihan.id);
          info("Pembayaran sedang diproses.");
          await load();
        },
        onError: () => {
          error("Pembayaran gagal.");
        },
        onClose: () => {
          verifyPayment(orderId, tagihan.id);
        },
      });
    } catch (err) {
      console.error("Bayar gagal:", err);
      error("Gagal memproses pembayaran.");
    } finally {
      setPayingId(null);
    }
  };

  const unpaidTotal = data
    .filter((t) => t.status === "unpaid" || t.status === "pending")
    .reduce((s, t) => s + t.jumlah, 0);

  return (
    <>
      <Script
        src={MIDTRANS_SNAP_URL}
        data-client-key={CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-bottom duration-700 pb-20">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tagihan Saya</h1>
          <p className="text-slate-500 font-medium mt-1">
            Iuran bulanan asrama dapat dibayar via Midtrans (transfer bank, e-wallet, QRIS, dll).
          </p>
        </div>

        {/* Summary */}
        <Card className="p-8 border-none shadow-premium rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-primary-700 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Belum Dibayar</p>
              <p className="text-4xl font-black mt-2">Rp {unpaidTotal.toLocaleString("id-ID")}</p>
              <p className="text-xs font-medium opacity-80 mt-2">
                {data.filter((t) => t.status === "unpaid" || t.status === "pending").length} tagihan menunggu pembayaran
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </Card>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Tagihan...</p>
          </div>
        ) : data.length === 0 ? (
          <Card className="p-12 border-none shadow-sm rounded-[2.5rem] text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Belum Ada Tagihan</h3>
            <p className="text-slate-500 font-medium mt-2">
              Tagihan akan muncul setelah admin generate untuk periode terkait.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((t) => {
              const meta = STATUS_META[t.status];
              const Icon = meta.Icon;
              const canPay = t.status === "unpaid" || t.status === "pending" || t.status === "expired";
              return (
                <Card key={t.id} className="p-6 border-none shadow-sm rounded-[2rem] bg-white">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {t.judul ?? "Iuran Bulanan"}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        {formatPeriode(t.periode)} · Kamar {t.nomorKamar} · Rp {t.jumlah.toLocaleString("id-ID")}
                      </p>
                      {t.catatan && (
                        <p className="text-xs text-slate-600 italic">&ldquo;{t.catatan}&rdquo;</p>
                      )}
                      {t.paidAt && (
                        <p className="text-xs text-emerald-600 font-bold">
                          Dibayar: {new Date(t.paidAt.seconds * 1000).toLocaleString("id-ID", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                          {t.paymentType && ` · ${t.paymentType.toUpperCase().replace(/_/g, " ")}`}
                        </p>
                      )}
                    </div>
                    {canPay && (
                      <Button
                        size="md"
                        className="rounded-2xl font-bold"
                        onClick={() => openMethodModal(t)}
                        loading={payingId === t.id}
                        disabled={payingId !== null}
                      >
                        Bayar Sekarang
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal pilih metode pembayaran (custom UI, BUKAN popup Midtrans) */}
      <Modal
        open={methodModalOpen}
        onClose={() => !payingId && setMethodModalOpen(false)}
        title="Pilih Metode Pembayaran"
        size="md"
      >
        <div className="space-y-4">
          {selectedTagihan && (
            <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100">
              <p className="text-[10px] font-black text-primary-700 uppercase tracking-widest">
                Total Tagihan
              </p>
              <p className="text-2xl font-black text-primary-900 mt-1">
                Rp {selectedTagihan.jumlah.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-primary-600 font-medium mt-1">
                {selectedTagihan.judul ?? "Iuran Bulanan"} · {formatPeriode(selectedTagihan.periode)}
              </p>
            </div>
          )}

          {loadingMethods ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Memuat metode...
              </p>
            </div>
          ) : availableMethods.length === 0 ? (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-center">
              <p className="text-sm font-bold text-rose-700">
                Belum ada metode pembayaran yang aktif.
              </p>
              <p className="text-xs text-rose-600 mt-1">
                Hubungi admin untuk mengaktifkan metode pembayaran.
              </p>
            </div>
          ) : (
            <>
              {(["instant", "ewallet", "va", "card"] as PaymentCategory[]).map((cat) => {
                const inCat = availableMethods.filter((m) => m.category === cat);
                if (inCat.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {CATEGORY_LABEL[cat]}
                    </p>
                    <div className="space-y-2">
                      {inCat.map((m) => {
                        const active = selectedMethodId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMethodId(m.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left ${
                              active
                                ? "bg-primary-50 border-primary-500 shadow-sm"
                                : "bg-white border-slate-200 hover:border-primary-300"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                              {methodLogos[m.id] ? (
                                <img src={methodLogos[m.id]} alt={m.label} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-2xl">{m.icon}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm">{m.label}</p>
                              {m.note && (
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{m.note}</p>
                              )}
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                                active ? "border-primary-600 bg-primary-600" : "border-slate-300"
                              }`}
                            >
                              {active && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl font-bold border-slate-200"
              onClick={() => setMethodModalOpen(false)}
              disabled={!!payingId}
            >
              Batal
            </Button>
            <Button
              className="flex-1 rounded-2xl font-bold"
              onClick={handleConfirmPay}
              disabled={!selectedMethodId || !!payingId || availableMethods.length === 0}
              loading={!!payingId}
            >
              Lanjut Bayar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
