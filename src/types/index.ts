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
  userId: string;
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
