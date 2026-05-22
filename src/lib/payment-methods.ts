// Daftar metode pembayaran Midtrans yang didukung di sistem ini.
// `id` = nilai untuk parameter `enabled_payments` di Snap API.

export type PaymentCategory = "instant" | "ewallet" | "va" | "card";

export interface PaymentMethodDef {
  id: string;
  label: string;
  category: PaymentCategory;
  icon: string; // emoji / character
  note?: string;
}

export const PAYMENT_METHODS: PaymentMethodDef[] = [
  // Instant
  { id: "qris", label: "QRIS", category: "instant", icon: "🔲", note: "Scan QR — semua e-wallet support" },

  // E-wallet
  { id: "gopay", label: "GoPay", category: "ewallet", icon: "🟢" },
  { id: "shopeepay", label: "ShopeePay", category: "ewallet", icon: "🟠" },

  // Virtual Account
  { id: "bca_va", label: "BCA Virtual Account", category: "va", icon: "🏦" },
  { id: "bni_va", label: "BNI Virtual Account", category: "va", icon: "🏦" },
  { id: "bri_va", label: "BRI Virtual Account", category: "va", icon: "🏦" },
  { id: "permata_va", label: "Permata Virtual Account", category: "va", icon: "🏦" },
  { id: "echannel", label: "Mandiri Bill Payment", category: "va", icon: "🏦" },

  // Kartu
  { id: "credit_card", label: "Kartu Kredit / Debit", category: "card", icon: "💳" },
];

export const CATEGORY_LABEL: Record<PaymentCategory, string> = {
  instant: "Instan",
  ewallet: "E-Wallet",
  va: "Transfer Bank (VA)",
  card: "Kartu",
};

/** Default kalau admin belum atur — pakai QRIS + GoPay saja. */
export const DEFAULT_ENABLED_METHODS = ["qris", "gopay"];

export function findPaymentMethod(id: string): PaymentMethodDef | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}
