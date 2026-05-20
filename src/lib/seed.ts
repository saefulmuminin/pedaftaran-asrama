import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as secondarySignOut,
} from "firebase/auth";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Kamar, Pendaftaran, Penghuni, UserProfile } from "@/types";

// Data mahasiswa dari list yang diberikan
const MAHASISWA = [
  { nama: "Yogi Supiarman",   nik: "1505012211970002" },
  { nama: "Wahyu Ilahi",       nik: "1502231604040002" },
  { nama: "M. Biro",            nik: "15020412109500001" },
  { nama: "M. Iqbal Fiddia",    nik: "1503032311000006" },
  { nama: "Agus Jayakusuma",    nik: "1571080408980081" },
  { nama: "Rian Ariansyah",     nik: "1502231204040001" },
  { nama: "Johanri",            nik: "1502232307000001" },
  { nama: "Robi Candra",        nik: "1502041312420001" },
  { nama: "Azhari",             nik: "1502230305010001" },
  { nama: "Moh Zuhri Akbar",    nik: "1502233401990002" },
  { nama: "Sapriadi",           nik: "1502121511000001" },
  { nama: "Arda Bili",          nik: "1502230106010001" },
  { nama: "Irpandi",            nik: "1502232306990002" },
  { nama: "Edo Firnando",       nik: "1502231206000001" },
  { nama: "Angga",              nik: "1502232206990001" },
  { nama: "Agun Andika",        nik: "1502233006030001" },
];

const KAPASITAS_PER_KAMAR = 4;
const SEED_PASSWORD = "asrama123";

// 17 kamar: 8 di lantai 1, 9 di lantai 2
const KAMAR_DEFINITIONS: { nomorKamar: string; lantai: number }[] = [
  ...Array.from({ length: 8 }, (_, i) => ({ nomorKamar: `10${i + 1}`, lantai: 1 })),
  ...Array.from({ length: 9 }, (_, i) => ({ nomorKamar: `20${i + 1}`, lantai: 2 })),
];

const KABUPATEN_LIST = [
  "Kota Jambi", "Muaro Jambi", "Batanghari", "Tebo", "Bungo",
  "Merangin", "Sarolangun", "Tanjung Jabung Barat", "Tanjung Jabung Timur",
  "Kerinci", "Sungai Penuh",
];

const UNIVERSITAS_LIST = [
  { univ: "Universitas Indonesia", fakultas: "Fakultas Teknik", jurusan: "Teknik Informatika" },
  { univ: "UPN Veteran Jakarta", fakultas: "Fakultas Ekonomi", jurusan: "Manajemen" },
  { univ: "Universitas Trisakti", fakultas: "Fakultas Hukum", jurusan: "Ilmu Hukum" },
  { univ: "Universitas Negeri Jakarta", fakultas: "Fakultas MIPA", jurusan: "Matematika" },
  { univ: "Universitas Gunadarma", fakultas: "Fakultas Ilmu Komputer", jurusan: "Sistem Informasi" },
  { univ: "Universitas Mercu Buana", fakultas: "Fakultas Teknik", jurusan: "Teknik Elektro" },
  { univ: "Universitas Pancasila", fakultas: "Fakultas Ekonomi", jurusan: "Akuntansi" },
];

function slugifyEmail(nama: string, idx: number): string {
  const slug = nama
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  return `${slug}${idx}@asramajambi.test`;
}

function pickFromList<T>(list: T[], idx: number): T {
  return list[idx % list.length];
}

function randomTanggalLahir(): string {
  // Tahun 1995-2003, format YYYY-MM-DD
  const year = 1995 + Math.floor(Math.random() * 9);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomNoHp(): string {
  let nomor = "08";
  for (let i = 0; i < 10; i++) nomor += Math.floor(Math.random() * 10);
  return nomor;
}

function randomNim(): string {
  let nim = "";
  for (let i = 0; i < 10; i++) nim += Math.floor(Math.random() * 10);
  return nim;
}

export interface SeedProgress {
  step: string;
  current: number;
  total: number;
}

export interface SeedResult {
  kamarDibuat: number;
  mahasiswaDibuat: number;
  pendaftaranDibuat: number;
  penghuniDibuat: number;
  errors: string[];
}

/**
 * Seed kamar + akun mahasiswa + pendaftaran + penghuni sekaligus.
 *
 * Penting: pembuatan akun Firebase Auth dilakukan via aplikasi sekunder agar
 * session admin yang sedang login tidak terganggu.
 */
export async function seedAsramaData(
  firebaseConfig: object,
  onProgress?: (p: SeedProgress) => void
): Promise<SeedResult> {
  const errors: string[] = [];

  const secondaryApp = getApps().find((a) => a.name === "Seeder") ??
    initializeApp(firebaseConfig, "Seeder");
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  // 1. Cek apakah sudah ada kamar — jangan duplicate
  const kamarSnap = await getDocs(collection(db, "kamar"));
  const existingKamarNomor = new Set(kamarSnap.docs.map((d) => (d.data() as Kamar).nomorKamar));

  // 2. Buat kamar yang belum ada
  const kamarIds: Record<string, string> = {};
  let kamarDibuat = 0;
  const totalKamar = KAMAR_DEFINITIONS.length;

  for (let i = 0; i < KAMAR_DEFINITIONS.length; i++) {
    const def = KAMAR_DEFINITIONS[i];
    onProgress?.({ step: `Membuat kamar ${def.nomorKamar}`, current: i + 1, total: totalKamar });

    if (existingKamarNomor.has(def.nomorKamar)) {
      // Sudah ada — ambil id existing
      const existing = kamarSnap.docs.find((d) => (d.data() as Kamar).nomorKamar === def.nomorKamar);
      if (existing) kamarIds[def.nomorKamar] = existing.id;
      continue;
    }

    const ref = doc(collection(db, "kamar"));
    const data: Omit<Kamar, "id"> = {
      nomorKamar: def.nomorKamar,
      lantai: def.lantai,
      jenisKelamin: "L",
      kapasitas: KAPASITAS_PER_KAMAR,
      terisi: 0,
      fasilitas: ["Kasur", "Lemari", "Meja Belajar", "Kipas Angin"],
      status: "tersedia",
      penghuniIds: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(ref, data);
    kamarIds[def.nomorKamar] = ref.id;
    kamarDibuat++;
  }

  // 3. Buat akun + dokumen untuk setiap mahasiswa, masukkan ke kamar (4 per kamar)
  let mahasiswaDibuat = 0;
  let pendaftaranDibuat = 0;
  let penghuniDibuat = 0;

  const kamarTerpakai: Record<string, { id: string; uids: string[] }> = {};

  for (let i = 0; i < MAHASISWA.length; i++) {
    const m = MAHASISWA[i];
    const kamarIdx = Math.floor(i / KAPASITAS_PER_KAMAR);
    const kamarDef = KAMAR_DEFINITIONS[kamarIdx];
    if (!kamarDef) break; // sudah lebih dari kapasitas

    onProgress?.({
      step: `Mendaftarkan ${m.nama}`,
      current: i + 1,
      total: MAHASISWA.length,
    });

    const email = slugifyEmail(m.nama, i + 1);

    // 3a. Auth user
    let uid: string;
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, SEED_PASSWORD);
      uid = cred.user.uid;
      mahasiswaDibuat++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${m.nama}: ${msg}`);
      continue;
    }

    const kab = pickFromList(KABUPATEN_LIST, i);
    const univ = pickFromList(UNIVERSITAS_LIST, i);
    const tanggalLahir = randomTanggalLahir();
    const noHp = randomNoHp();
    const nim = randomNim();
    const kamarId = kamarIds[kamarDef.nomorKamar];

    // 3b. Users doc
    const userProfile: UserProfile = {
      uid,
      email,
      displayName: m.nama,
      role: "mahasiswa",
      noHp,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(doc(secondaryDb, "users", uid), userProfile);

    // 3c. Pendaftaran doc (status diterima karena sudah jadi penghuni)
    const pendaftaranRef = doc(collection(secondaryDb, "pendaftaran"));
    const pendaftaran: Omit<Pendaftaran, "id"> = {
      userId: uid,
      status: "diterima",
      namaLengkap: m.nama,
      nik: m.nik,
      tempatLahir: kab,
      tanggalLahir,
      jenisKelamin: "L",
      agama: "Islam",
      golonganDarah: pickFromList(["A", "B", "AB", "O"], i),
      noHp,
      email,
      alamatAsal: `Jl. Merdeka No. ${i + 10}, ${kab}`,
      kabupatenAsal: kab,
      nim,
      universitas: univ.univ,
      fakultas: univ.fakultas,
      jurusan: univ.jurusan,
      semester: 3 + (i % 6),
      ipk: (3 + Math.random()).toFixed(2),
      alasanMasukAsrama: "Membutuhkan tempat tinggal yang aman, nyaman, dan dekat dengan kampus untuk menunjang aktivitas perkuliahan.",
      preferensiKamar: "putra",
      namaOrtu: `Bapak ${m.nama.split(" ")[0]} Senior`,
      hubunganOrtu: "Ayah",
      noHpOrtu: randomNoHp(),
      nomorKamar: kamarDef.nomorKamar,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      submittedAt: Timestamp.now(),
      diverifikasiAt: Timestamp.now(),
      diterimaAt: Timestamp.now(),
    };
    await setDoc(pendaftaranRef, pendaftaran);
    pendaftaranDibuat++;

    // 3d. Penghuni doc
    const penghuniRef = doc(collection(db, "penghuni"));
    const penghuni: Omit<Penghuni, "id"> = {
      pendaftaranId: pendaftaranRef.id,
      userId: uid,
      namaLengkap: m.nama,
      nim,
      universitas: univ.univ,
      noHp,
      nomorKamar: kamarDef.nomorKamar,
      kamarId,
      tanggalMasuk: Timestamp.now(),
      status: "aktif",
      createdAt: Timestamp.now(),
    };
    await setDoc(penghuniRef, penghuni);
    penghuniDibuat++;

    // Track for kamar update
    if (!kamarTerpakai[kamarDef.nomorKamar]) {
      kamarTerpakai[kamarDef.nomorKamar] = { id: kamarId, uids: [] };
    }
    kamarTerpakai[kamarDef.nomorKamar].uids.push(uid);
  }

  // Sign out dari secondary auth — bersihkan session sementara
  try { await secondarySignOut(secondaryAuth); } catch { /* ignore */ }

  // 4. Update kamar.terisi, penghuniIds, status
  onProgress?.({ step: "Mengupdate kapasitas kamar", current: 0, total: Object.keys(kamarTerpakai).length });
  const batch = writeBatch(db);
  Object.values(kamarTerpakai).forEach(({ id, uids }) => {
    const terisi = uids.length;
    const status: Kamar["status"] = terisi >= KAPASITAS_PER_KAMAR ? "penuh" : "tersedia";
    batch.update(doc(db, "kamar", id), {
      terisi,
      penghuniIds: uids,
      status,
      updatedAt: Timestamp.now(),
    });
  });
  await batch.commit();

  return { kamarDibuat, mahasiswaDibuat, pendaftaranDibuat, penghuniDibuat, errors };
}
