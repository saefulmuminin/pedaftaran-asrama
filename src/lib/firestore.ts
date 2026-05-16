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
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  UserProfile,
  Pendaftaran,
  Kamar,
  Penghuni,
  Notifikasi,
  DashboardStats,
} from "@/types";

// --- USER ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", profile.uid), profile);
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
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
