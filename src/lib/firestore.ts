import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  writeBatch,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { auth, db } from "./firebase";
import type {
  UserProfile,
  Pendaftaran,
  Kamar,
  Penghuni,
  Notifikasi,
  DashboardStats,
  Tagihan,
  StatusTagihan,
  Tamu,
  Kegiatan,
  KategoriKegiatan,
  TataTertibItem,
  KategoriTataTertib,
  PaymentSettings,
} from "@/types";
import { DEFAULT_ENABLED_METHODS } from "./payment-methods";

export const TAGIHAN_BULANAN = 70_000; // Rp 70.000 per bulan per penghuni

// --- USER ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  // Inject uid dari path agar selalu tersedia walau dokumen lama tidak punya field uid
  return { uid, ...snap.data() } as UserProfile;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", profile.uid), profile);
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  // Primary write — yang ini wajib sukses
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });

  // Side effects: Auth sync + cascade ke pendaftaran/penghuni
  // Dijalankan fire-and-forget agar tidak memblokir/menggagalkan primary update
  // saat rules menolak salah satu cascade (misal mahasiswa tidak boleh menulis penghuni)
  syncProfileSideEffects(uid, data).catch((err) => {
    console.warn("Profile side effect gagal (non-fatal):", err);
  });
}

async function syncProfileSideEffects(uid: string, data: Partial<UserProfile>): Promise<void> {
  // 1. Sync ke Firebase Auth
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const authUpdate: { displayName?: string | null; photoURL?: string | null } = {};
    if (data.displayName !== undefined) authUpdate.displayName = data.displayName || null;
    if (data.photoURL !== undefined) authUpdate.photoURL = data.photoURL || null;
    if (Object.keys(authUpdate).length > 0) {
      try {
        await updateAuthProfile(auth.currentUser, authUpdate);
      } catch (err) {
        console.warn("Auth profile sync gagal:", err);
      }
    }
  }

  // 2. Cascade field overlap ke pendaftaran & penghuni
  const cascade: { namaLengkap?: string; noHp?: string } = {};
  if (data.displayName !== undefined) cascade.namaLengkap = data.displayName;
  if (data.noHp !== undefined) cascade.noHp = data.noHp;
  if (Object.keys(cascade).length === 0) return;

  try {
    const pendaftaran = await getPendaftaranByUser(uid);
    if (pendaftaran) {
      await updateDoc(doc(db, "pendaftaran", pendaftaran.id), {
        ...cascade,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (err) {
    console.warn("Cascade ke pendaftaran gagal:", err);
  }

  try {
    const penghuniSnap = await getDocs(
      query(collection(db, "penghuni"), where("userId", "==", uid))
    );
    await Promise.all(
      penghuniSnap.docs.map((d) =>
        updateDoc(doc(db, "penghuni", d.id), cascade).catch((err) => {
          console.warn("Cascade ke penghuni gagal:", err);
        })
      )
    );
  } catch (err) {
    console.warn("Query penghuni gagal:", err);
  }
}

// --- PENDAFTARAN ---
export async function getPendaftaranByUser(userId: string): Promise<Pendaftaran | null> {
  const q = query(collection(db, "pendaftaran"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Pendaftaran;
}

export async function getPendaftaranById(id: string): Promise<Pendaftaran | null> {
  const snap = await getDoc(doc(db, "pendaftaran", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Pendaftaran : null;
}

export async function getAllPendaftaran(statusFilter?: string): Promise<Pendaftaran[]> {
  // Fetch semua lalu filter+sort di client — tidak butuh composite index
  const snap = await getDocs(collection(db, "pendaftaran"));
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pendaftaran));

  if (statusFilter && statusFilter !== "semua") {
    list = list.filter((p) => p.status === statusFilter);
  }

  return list.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
}

export async function createPendaftaran(
  data: Omit<Pendaftaran, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "pendaftaran"), data);
  return ref.id;
}

export async function deleteAllPendaftaran(): Promise<number> {
  const snap = await getDocs(collection(db, "pendaftaran"));
  if (snap.empty) return 0;

  // Firestore batch limit: 500 ops per batch
  const docs = snap.docs;
  let deleted = 0;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += Math.min(500, docs.length - i);
  }
  return deleted;
}

export async function updatePendaftaran(
  id: string,
  data: Partial<Pendaftaran>
): Promise<void> {
  await updateDoc(doc(db, "pendaftaran", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// --- KAMAR ---
export async function getAllKamar(): Promise<Kamar[]> {
  const snap = await getDocs(collection(db, "kamar"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Kamar))
    .sort((a, b) => a.nomorKamar.localeCompare(b.nomorKamar));
}

export async function getKamarById(id: string): Promise<Kamar | null> {
  const snap = await getDoc(doc(db, "kamar", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Kamar : null;
}

export async function createKamar(data: Omit<Kamar, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "kamar"), data);
  return ref.id;
}

export async function updateKamar(id: string, data: Partial<Kamar>): Promise<void> {
  await updateDoc(doc(db, "kamar", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteKamar(id: string): Promise<void> {
  await deleteDoc(doc(db, "kamar", id));
}

// --- PENGHUNI ---
export async function getAllPenghuni(): Promise<Penghuni[]> {
  // Filter aktif, sort client-side — tidak butuh composite index
  const snap = await getDocs(
    query(collection(db, "penghuni"), where("status", "==", "aktif"))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Penghuni))
    .sort((a, b) => b.tanggalMasuk.seconds - a.tanggalMasuk.seconds);
}

export async function createPenghuni(data: Omit<Penghuni, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "penghuni"), data);
  return ref.id;
}

export async function updatePenghuni(id: string, data: Partial<Penghuni>): Promise<void> {
  await updateDoc(doc(db, "penghuni", id), data);
}

// --- NOTIFIKASI ---
export async function getNotifikasiByUser(userId: string): Promise<Notifikasi[]> {
  // Hanya filter userId — tidak pakai orderBy agar tidak butuh composite index
  const q = query(
    collection(db, "notifikasi"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Notifikasi))
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    .slice(0, 20);
}

export async function createNotifikasi(data: Omit<Notifikasi, "id">): Promise<void> {
  await addDoc(collection(db, "notifikasi"), data);
}

export async function markNotifikasiRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifikasi", id), { dibaca: true });
}

export function subscribeNotifikasi(
  userId: string,
  callback: (notifs: Notifikasi[]) => void
) {
  // Hanya filter userId — sort di callback
  const q = query(
    collection(db, "notifikasi"),
    where("userId", "==", userId)
  );
  return onSnapshot(q, (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Notifikasi))
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
      .slice(0, 20);
    callback(sorted);
  });
}

// --- TAGIHAN ---
function periodeNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentPeriode(): string {
  return periodeNow();
}

export function formatPeriode(periode: string): string {
  const [year, month] = periode.split("-");
  const bulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${bulan[parseInt(month, 10)]} ${year}`;
}

export async function getTagihanByUser(userId: string): Promise<Tagihan[]> {
  const q = query(collection(db, "tagihan"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Tagihan))
    .sort((a, b) => b.periode.localeCompare(a.periode));
}

export async function getAllTagihan(periode?: string): Promise<Tagihan[]> {
  const snap = await getDocs(collection(db, "tagihan"));
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tagihan));
  if (periode) list = list.filter((t) => t.periode === periode);
  return list.sort((a, b) => {
    const byPeriode = b.periode.localeCompare(a.periode);
    if (byPeriode !== 0) return byPeriode;
    return a.namaLengkap.localeCompare(b.namaLengkap);
  });
}

export async function getTagihanById(id: string): Promise<Tagihan | null> {
  const snap = await getDoc(doc(db, "tagihan", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Tagihan) : null;
}

export async function updateTagihan(
  id: string,
  data: Partial<Omit<Tagihan, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "tagihan", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function setTagihanStatusByOrderId(
  orderId: string,
  status: StatusTagihan,
  extra: Partial<Tagihan> = {}
): Promise<boolean> {
  const snap = await getDocs(
    query(collection(db, "tagihan"), where("midtransOrderId", "==", orderId))
  );
  if (snap.empty) return false;
  const ref = snap.docs[0].ref;
  await updateDoc(ref, {
    ...extra,
    status,
    updatedAt: Timestamp.now(),
  });
  return true;
}

export interface GenerateBulkOpts {
  judul?: string;
  jumlah?: number;
  catatan?: string;
}

/**
 * Generate tagihan untuk semua penghuni aktif pada periode tertentu.
 * Dedup: kombinasi (penghuniId, periode, judul) — jadi judul beda di periode sama tetap dibuat.
 */
export async function generateTagihanBulkPeriode(
  periode: string,
  adminUid: string,
  opts: GenerateBulkOpts = {}
): Promise<{ created: number; skipped: number }> {
  const judul = opts.judul?.trim() || "Iuran Bulanan";
  const jumlah = opts.jumlah ?? TAGIHAN_BULANAN;
  const catatan = opts.catatan?.trim();

  const penghuniSnap = await getDocs(
    query(collection(db, "penghuni"), where("status", "==", "aktif"))
  );
  const penghuniList = penghuniSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Penghuni));

  const existingSnap = await getDocs(
    query(collection(db, "tagihan"), where("periode", "==", periode))
  );
  const existingKeys = new Set(
    existingSnap.docs.map((d) => {
      const t = d.data() as Tagihan;
      return `${t.penghuniId}::${t.judul}`;
    })
  );

  let created = 0;
  let skipped = 0;
  const now = Timestamp.now();

  for (const p of penghuniList) {
    const key = `${p.id}::${judul}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    await addDoc(collection(db, "tagihan"), {
      penghuniId: p.id,
      userId: p.userId,
      namaLengkap: p.namaLengkap,
      nomorKamar: p.nomorKamar,
      periode,
      judul,
      jumlah,
      ...(catatan ? { catatan } : {}),
      status: "unpaid" as StatusTagihan,
      createdAt: now,
      updatedAt: now,
      createdBy: adminUid,
    });
    created++;
  }

  return { created, skipped };
}

/**
 * Buat satu tagihan custom untuk satu penghuni — mis. denda atau iuran tambahan.
 */
export async function createTagihanCustom(
  penghuni: Pick<Penghuni, "id" | "userId" | "namaLengkap" | "nomorKamar">,
  data: {
    judul: string;
    jumlah: number;
    periode: string;
    catatan?: string;
  },
  adminUid: string
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, "tagihan"), {
    penghuniId: penghuni.id,
    userId: penghuni.userId,
    namaLengkap: penghuni.namaLengkap,
    nomorKamar: penghuni.nomorKamar,
    periode: data.periode,
    judul: data.judul,
    jumlah: data.jumlah,
    ...(data.catatan ? { catatan: data.catatan } : {}),
    status: "unpaid" as StatusTagihan,
    createdAt: now,
    updatedAt: now,
    createdBy: adminUid,
  });
  return ref.id;
}

export async function deleteTagihan(id: string): Promise<void> {
  await deleteDoc(doc(db, "tagihan", id));
}

// --- PAYMENT SETTINGS ---
const PAYMENT_SETTINGS_DOC = doc(db, "pengaturan", "pembayaran");

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const snap = await getDoc(PAYMENT_SETTINGS_DOC);
  if (!snap.exists()) {
    // Default kalau belum diatur admin
    return { enabledMethods: DEFAULT_ENABLED_METHODS, updatedAt: Timestamp.now() };
  }
  const data = snap.data() as PaymentSettings;
  return {
    enabledMethods: data.enabledMethods?.length ? data.enabledMethods : DEFAULT_ENABLED_METHODS,
    updatedAt: data.updatedAt ?? Timestamp.now(),
  };
}

export async function updatePaymentSettings(enabledMethods: string[]): Promise<void> {
  await setDoc(PAYMENT_SETTINGS_DOC, {
    enabledMethods,
    updatedAt: Timestamp.now(),
  });
}

// --- TAMU ---
export async function createTamu(data: Omit<Tamu, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "tamu"), data);
  return ref.id;
}

export async function getAllTamu(): Promise<Tamu[]> {
  const snap = await getDocs(collection(db, "tamu"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Tamu))
    .sort((a, b) => b.waktuKedatangan.seconds - a.waktuKedatangan.seconds);
}

export async function getTamuByRange(
  fromTs: Timestamp,
  toTs: Timestamp
): Promise<Tamu[]> {
  const snap = await getDocs(collection(db, "tamu"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Tamu))
    .filter((t) =>
      t.waktuKedatangan.seconds >= fromTs.seconds &&
      t.waktuKedatangan.seconds <= toTs.seconds
    )
    .sort((a, b) => b.waktuKedatangan.seconds - a.waktuKedatangan.seconds);
}

export async function deleteTamu(id: string): Promise<void> {
  await deleteDoc(doc(db, "tamu", id));
}

// --- TATA TERTIB ---
export async function getAllTataTertib(): Promise<TataTertibItem[]> {
  const snap = await getDocs(collection(db, "tataTertib"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as TataTertibItem))
    .sort((a, b) => {
      if (a.kategori !== b.kategori) return a.kategori === "kewajiban" ? -1 : 1;
      return a.urutan - b.urutan;
    });
}

export async function createTataTertibItem(
  data: Omit<TataTertibItem, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "tataTertib"), data);
  return ref.id;
}

export async function updateTataTertibItem(
  id: string,
  data: Partial<Omit<TataTertibItem, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "tataTertib", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteTataTertibItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "tataTertib", id));
}

const DEFAULT_KEWAJIBAN = [
  "Menjaga nama baik, ketertiban, dan keamanan asrama.",
  "Menjaga dan memelihara fasilitas serta barang-barang inventaris asrama.",
  "Melapor segala bentuk kegiatan yang berkaitan dengan asrama kepada pengurus.",
  "Berpakaian rapi dan pantas di lingkungan asrama.",
  "Membayar uang bulanan asrama bagi seluruh penghuni sebesar Rp 70.000.",
  "Menghormati teman-teman yang sedang belajar dan menunaikan ibadah.",
  "Mengikuti dan melaksanakan kegiatan asrama (kerja bakti, rapat, dan kegiatan lainnya).",
  "Melaporkan setiap tamu yang datang kepada pengurus asrama.",
  "Keluar / masuk asrama harap mengunci pagar.",
];

const DEFAULT_LARANGAN = [
  "Membawa, mengedarkan, dan mengkonsumsi segala jenis minuman keras, narkotika, serta zat adiktif lainnya di lingkungan asrama.",
  "Main judi di lingkungan asrama.",
  "Membawa wanita ke dalam kamar kecuali muhrim (dengan pintu tertutup).",
  "Waktu teman wanita berkunjung dari pukul 07:00 pagi s/d 23:00 malam.",
  "Membunyikan radio / TV / speaker dengan keras pada waktu jam belajar, ibadah, atau istirahat.",
  "Membawa teman menginap tanpa sepengetahuan pengurus asrama.",
];

/**
 * Seed tata tertib default ke Firestore. Skip jika sudah ada item.
 */
export async function seedDefaultTataTertib(): Promise<{ created: number; skipped: boolean }> {
  const existing = await getDocs(collection(db, "tataTertib"));
  if (!existing.empty) {
    return { created: 0, skipped: true };
  }
  const now = Timestamp.now();
  const tasks: Promise<unknown>[] = [];
  DEFAULT_KEWAJIBAN.forEach((teks, idx) => {
    tasks.push(addDoc(collection(db, "tataTertib"), {
      kategori: "kewajiban" as KategoriTataTertib,
      teks,
      urutan: idx + 1,
      createdAt: now,
      updatedAt: now,
    }));
  });
  DEFAULT_LARANGAN.forEach((teks, idx) => {
    tasks.push(addDoc(collection(db, "tataTertib"), {
      kategori: "larangan" as KategoriTataTertib,
      teks,
      urutan: idx + 1,
      createdAt: now,
      updatedAt: now,
    }));
  });
  await Promise.all(tasks);
  return { created: tasks.length, skipped: false };
}

// --- KEGIATAN ---
export async function createKegiatan(data: Omit<Kegiatan, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "kegiatan"), data);
  return ref.id;
}

export async function getAllKegiatan(kategori?: KategoriKegiatan): Promise<Kegiatan[]> {
  const snap = await getDocs(collection(db, "kegiatan"));
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Kegiatan));
  if (kategori) list = list.filter((k) => k.kategori === kategori);
  return list.sort((a, b) => b.tanggalMulai.seconds - a.tanggalMulai.seconds);
}

export async function updateKegiatan(
  id: string,
  data: Partial<Omit<Kegiatan, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "kegiatan", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteKegiatan(id: string): Promise<void> {
  await deleteDoc(doc(db, "kegiatan", id));
}

// --- DASHBOARD STATS ---
export async function getDashboardStats(): Promise<DashboardStats> {
  const [pendaftaranSnap, kamarSnap, penghuniSnap] = await Promise.all([
    getDocs(collection(db, "pendaftaran")),
    getDocs(collection(db, "kamar")),
    getDocs(query(collection(db, "penghuni"), where("status", "==", "aktif"))),
  ]);

  const pendaftaranList = pendaftaranSnap.docs.map((d) => d.data() as Pendaftaran);
  const kamarList = kamarSnap.docs.map((d) => d.data() as Kamar);

  return {
    totalPendaftar: pendaftaranList.length,
    submitted: pendaftaranList.filter((p) => p.status === "submitted").length,
    diverifikasi: pendaftaranList.filter((p) => p.status === "diverifikasi").length,
    diterima: pendaftaranList.filter((p) => p.status === "diterima").length,
    ditolak: pendaftaranList.filter((p) => p.status === "ditolak").length,
    totalKamar: kamarList.length,
    kamarTersedia: kamarList.filter((k) => k.status === "tersedia").length,
    totalPenghuni: penghuniSnap.size,
  };
}
