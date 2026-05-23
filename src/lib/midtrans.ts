// Midtrans Snap helper — server-side only.
// Pakai REST API langsung (tanpa SDK) agar tidak perlu dependency tambahan.

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";

const SNAP_BASE = isProduction
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

const API_BASE = isProduction
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

function authHeader(): string {
  return "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64");
}

export interface CreateSnapParams {
  orderId: string;
  grossAmount: number;
  customer: {
    first_name: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  /** URL redirect setelah user selesai pembayaran (Snap mengembalikan order_id & transaction_status sebagai query param). */
  finishUrl?: string;
  /** Restrict metode pembayaran yang muncul di popup Snap, mis. ['qris']. */
  enabledPayments?: string[];
}

export interface SnapResponse {
  token: string;
  redirect_url: string;
}

export async function createSnapTransaction(params: CreateSnapParams): Promise<SnapResponse> {
  if (!SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY belum di-set di .env.local");
  }

  const body: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: params.customer,
    item_details: params.itemDetails,
    credit_card: { secure: true },
  };

  if (params.finishUrl) {
    body.callbacks = { finish: params.finishUrl };
  }
  if (params.enabledPayments && params.enabledPayments.length > 0) {
    body.enabled_payments = params.enabledPayments;
  }

  const res = await fetch(`${SNAP_BASE}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Midtrans snap error ${res.status}: ${text}`);
  }

  return res.json() as Promise<SnapResponse>;
}

export interface MidtransStatusResponse {
  order_id: string;
  status_code: string;
  transaction_status: string; // capture, settlement, pending, deny, cancel, expire, failure, refund
  payment_type?: string;
  fraud_status?: string;
  signature_key?: string;
  gross_amount?: string;
  transaction_id?: string;
}

export async function getTransactionStatus(orderId: string): Promise<MidtransStatusResponse> {
  if (!SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY belum di-set di .env.local");
  }
  const res = await fetch(`${API_BASE}/${orderId}/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: authHeader(),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Midtrans status error ${res.status}: ${text}`);
  }
  return res.json() as Promise<MidtransStatusResponse>;
}

/**
 * Verifikasi signature dari webhook Midtrans.
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 */
export async function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): Promise<boolean> {
  const crypto = await import("crypto");
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + SERVER_KEY)
    .digest("hex");
  return expected === signatureKey;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE API — untuk render custom payment UI (tanpa popup Snap)
// ─────────────────────────────────────────────────────────────────────────────

export type CoreChargeBank = "bca" | "bni" | "bri" | "permata";

export interface CoreChargeParams {
  orderId: string;
  grossAmount: number;
  customer: { first_name: string; email: string; phone?: string };
  itemDetails: Array<{ id: string; name: string; price: number; quantity: number }>;
  /** Salah satu: bca_va, bni_va, bri_va, permata_va, echannel, gopay, shopeepay */
  method: string;
}

export interface CoreChargeAction {
  name: string;
  method: string;
  url: string;
}

export interface CoreChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  // VA fields (bank_transfer)
  va_numbers?: Array<{ bank: string; va_number: string }>;
  // Permata
  permata_va_number?: string;
  // Mandiri Bill (echannel)
  bill_key?: string;
  biller_code?: string;
  // GoPay / ShopeePay
  actions?: CoreChargeAction[];
  // QR
  qr_string?: string;
  expiry_time?: string;
}

const API_CHARGE = isProduction
  ? "https://api.midtrans.com/v2/charge"
  : "https://api.sandbox.midtrans.com/v2/charge";

function buildChargeBody(params: CoreChargeParams): Record<string, unknown> {
  const base = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: params.customer,
    item_details: params.itemDetails,
  };

  switch (params.method) {
    case "bca_va":
    case "bni_va":
    case "bri_va":
    case "permata_va": {
      const bank = params.method.replace("_va", "") as CoreChargeBank;
      return { ...base, payment_type: "bank_transfer", bank_transfer: { bank } };
    }
    case "echannel":
      return {
        ...base,
        payment_type: "echannel",
        echannel: {
          bill_info1: "Pembayaran",
          bill_info2: "Iuran Asrama",
        },
      };
    case "gopay":
      return { ...base, payment_type: "gopay" };
    case "shopeepay":
      return { ...base, payment_type: "shopeepay" };
    default:
      throw new Error(`Method tidak didukung untuk Core API: ${params.method}`);
  }
}

export async function chargeCore(params: CoreChargeParams): Promise<CoreChargeResponse> {
  if (!SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY belum di-set di .env.local");
  }

  const res = await fetch(API_CHARGE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(buildChargeBody(params)),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Midtrans charge error ${res.status}: ${text}`);
  }

  return res.json() as Promise<CoreChargeResponse>;
}

/**
 * Map status Midtrans → status internal Tagihan.
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): "lunas" | "pending" | "expired" | "cancelled" | "unpaid" {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge" ? "pending" : "lunas";
    case "settlement":
      return "lunas";
    case "pending":
      return "pending";
    case "deny":
    case "cancel":
    case "failure":
      return "cancelled";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
      return "cancelled";
    default:
      return "unpaid";
  }
}
