import { type ClassValue, clsx } from "clsx";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(ts: Timestamp | Date | string | undefined, fmt = "dd MMMM yyyy"): string {
  if (!ts) return "-";
  const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return format(date, fmt, { locale: id });
}

export function formatDateTime(ts: Timestamp | Date | undefined): string {
  if (!ts) return "-";
  const date = ts instanceof Timestamp ? ts.toDate() : ts;
  return format(date, "dd MMM yyyy, HH:mm", { locale: id });
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Menunggu Verifikasi",
    diverifikasi: "Sedang Diverifikasi",
    diterima: "Diterima",
    ditolak: "Ditolak",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-amber-50 text-amber-600 border border-amber-100",
    diverifikasi: "bg-sky-50 text-sky-600 border border-sky-100",
    diterima: "bg-primary-50 text-primary-600 border border-primary-100",
    ditolak: "bg-rose-50 text-rose-600 border border-rose-100",
  };
  return colors[status] ?? "bg-slate-100 text-slate-600";
}

export function getKamarStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    tersedia: "Tersedia",
    penuh: "Penuh",
    perawatan: "Perawatan",
  };
  return labels[status] ?? status;
}

export function getKamarStatusColor(status: string): string {
  const colors: Record<string, string> = {
    tersedia: "bg-primary-50 text-primary-600 border border-primary-100",
    penuh: "bg-rose-50 text-rose-600 border border-rose-100",
    perawatan: "bg-amber-50 text-amber-600 border border-amber-100",
  };
  return colors[status] ?? "bg-slate-100 text-slate-600";
}
