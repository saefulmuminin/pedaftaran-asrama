import { Timestamp } from "firebase/firestore";

export type UserRole = "mahasiswa" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  noHp?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type StatusPendaftaran = "draft" | "submitted" | "diverifikasi" | "diterima" | "ditolak";

export interface Pendaftaran {
  id: string;
  // Diisi saat admin menerima pendaftaran & akun Auth dibuat.
  // null saat pendaftaran masih submitted/diverifikasi tanpa akun.
  userId: string | null;
  status: StatusPendaftaran;

  // Biodata Pribadi
  namaLengkap: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  agama: string;
  golonganDarah: string;

  // Kontak
  noHp: string;
  email: string;
  alamatAsal: string;
  kabupatenAsal: string;

  // Data Akademik
  nim: string;
  universitas: string;
  fakultas: string;
  jurusan: string;
  semester: number;
  ipk: string;

  // Kebutuhan Asrama
  alasanMasukAsrama: string;
  preferensiKamar: "putra" | "putri";

  // Kontak Darurat
  namaOrtu: string;
  hubunganOrtu: string;
  noHpOrtu: string;

  // Dokumen
  fotoUrl?: string;
  ktpUrl?: string;
  ktmUrl?: string;
  suratKeteranganUrl?: string;

  // Admin
  catatanAdmin?: string;
  adminId?: string;
  nomorKamar?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt?: Timestamp;
  diverifikasiAt?: Timestamp;
  diterimaAt?: Timestamp;
  ditolakAt?: Timestamp;
}

export type StatusKamar = "tersedia" | "penuh" | "perawatan";

export interface Kamar {
  id: string;
  nomorKamar: string;
  lantai: number;
  jenisKelamin: "L" | "P";
  kapasitas: number;
  terisi: number;
  fasilitas: string[];
  status: StatusKamar;
  penghuniIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Penghuni {
  id: string;
  pendaftaranId: string;
  userId: string;
  namaLengkap: string;
  nim: string;
  universitas: string;
  noHp: string;
  nomorKamar: string;
  kamarId: string;
  tanggalMasuk: Timestamp;
  tanggalKeluar?: Timestamp;
  status: "aktif" | "keluar";
  createdAt: Timestamp;
}

export interface Notifikasi {
  id: string;
  userId: string;
  judul: string;
  pesan: string;
  tipe: "info" | "success" | "warning" | "error";
  dibaca: boolean;
  createdAt: Timestamp;
}

export interface DashboardStats {
  totalPendaftar: number;
  submitted: number;
  diverifikasi: number;
  diterima: number;
  ditolak: number;
  totalKamar: number;
  kamarTersedia: number;
  totalPenghuni: number;
}

export type KategoriTataTertib = "kewajiban" | "larangan";

export interface TataTertibItem {
  id: string;
  kategori: KategoriTataTertib;
  teks: string;
  urutan: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type KategoriKegiatan = "komunitas" | "wajib" | "laporan";
// komunitas = dibuat mahasiswa untuk teman-teman (acara, ngumpul, dll)
// wajib     = dibuat admin (kerja bakti, rapat) — semua wajib hadir
// laporan   = mahasiswa lapor kegiatan asrama ke pengurus

export interface Kegiatan {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: KategoriKegiatan;
  // Penyelenggara
  dibuatOlehUid: string;
  dibuatOlehNama: string;
  dibuatOlehRole: UserRole;
  // Waktu pelaksanaan
  tanggalMulai: Timestamp;
  tanggalSelesai?: Timestamp;
  lokasi?: string;
  // Untuk laporan ke pengurus
  ditanggapiAdmin?: boolean;
  catatanAdmin?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Tamu {
  id: string;
  // Pelapor
  dilaporOlehUid: string;
  dilaporOlehNama: string;
  dilaporOlehRole: UserRole;
  // Data tamu
  namaTamu: string;
  hubungan: string; // teman, keluarga, dosen, dll
  noHpTamu?: string;
  // Tujuan kunjungan
  untukPenghuni?: string; // nama penghuni yang dikunjungi
  keperluan: string;
  waktuKedatangan: Timestamp;
  waktuKepulangan?: Timestamp;
  catatan?: string;
  createdAt: Timestamp;
}

export type StatusTagihan = "unpaid" | "pending" | "lunas" | "expired" | "cancelled";

export interface PaymentSettings {
  /** Metode Midtrans yang diaktifkan, mis. ['qris', 'gopay', 'bca_va']. */
  enabledMethods: string[];
  updatedAt: Timestamp;
}

export interface Tagihan {
  id: string;
  penghuniId: string;
  userId: string;
  namaLengkap: string;
  nomorKamar: string;
  // Format: "2026-05" untuk bulan Mei 2026
  periode: string;
  /** Judul tagihan — mis. "Iuran Bulanan", "Denda Keterlambatan", "Iuran Renovasi" */
  judul: string;
  /** Catatan tambahan opsional dari admin */
  catatan?: string;
  jumlah: number; // dalam IDR
  status: StatusTagihan;
  // Midtrans
  midtransOrderId?: string;
  midtransToken?: string;
  paymentType?: string;
  paidAt?: Timestamp;
  expiredAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // admin uid
}
