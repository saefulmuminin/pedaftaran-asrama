// Daftar metode pembayaran Midtrans yang didukung di sistem ini.
// `id` = nilai untuk parameter `enabled_payments` di Snap API.

export type PaymentCategory = "ewallet" | "va";

export interface PaymentMethodDef {
  id: string;
  label: string;
  category: PaymentCategory;
  icon: string; // emoji / character
  note?: string;
}

export const PAYMENT_METHODS: PaymentMethodDef[] = [
  // E-wallet (GoPay menampilkan QR code yang bisa di-scan)
  { id: "gopay", label: "GoPay", category: "ewallet", icon: "🟢", note: "Scan QR via aplikasi GoPay" },
  { id: "shopeepay", label: "ShopeePay", category: "ewallet", icon: "🟠" },

  // Virtual Account
  { id: "bca_va", label: "BCA Virtual Account", category: "va", icon: "🏦" },
  { id: "bni_va", label: "BNI Virtual Account", category: "va", icon: "🏦" },
  { id: "bri_va", label: "BRI Virtual Account", category: "va", icon: "🏦" },
  { id: "permata_va", label: "Permata Virtual Account", category: "va", icon: "🏦" },
  { id: "echannel", label: "Mandiri Bill Payment", category: "va", icon: "🏦" },
];

export const CATEGORY_LABEL: Record<PaymentCategory, string> = {
  ewallet: "E-Wallet",
  va: "Transfer Bank (VA)",
};

/** Default kalau admin belum atur — pakai GoPay saja (universal di Sandbox). */
export const DEFAULT_ENABLED_METHODS = ["gopay"];

export function findPaymentMethod(id: string): PaymentMethodDef | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}
