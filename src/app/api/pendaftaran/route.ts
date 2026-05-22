import { NextRequest } from "next/server";
import { addDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Rate limit per-IP sederhana (in-memory). Cocok untuk dev/single-instance.
// Untuk produksi multi-instance, ganti dengan Redis / Upstash.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const ipHits = new Map<string, { count: number; firstAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now - entry.firstAt > RATE_WINDOW_MS) {
    ipHits.set(ip, { count: 1, firstAt: now });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

interface PendaftaranPayload {
  namaLengkap: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  agama: string;
  golonganDarah: string;
  email: string;
  noHp: string;
  alamatAsal: string;
  kabupatenAsal: string;
  nim: string;
  universitas: string;
  fakultas: string;
  jurusan: string;
  semester: number;
  ipk: string;
  alasanMasukAsrama: string;
  preferensiKamar: "putra" | "putri";
  namaOrtu: string;
  hubunganOrtu: string;
  noHpOrtu: string;
  fotoUrl?: string;
  ktpUrl?: string;
  ktmUrl?: string;
  suratKeteranganUrl?: string;
}

const REQUIRED_FIELDS: (keyof PendaftaranPayload)[] = [
  "namaLengkap", "nik", "tempatLahir", "tanggalLahir", "jenisKelamin",
  "agama", "golonganDarah", "email", "noHp", "alamatAsal", "kabupatenAsal",
  "nim", "universitas", "fakultas", "jurusan", "semester", "ipk",
  "alasanMasukAsrama", "preferensiKamar", "namaOrtu", "hubunganOrtu", "noHpOrtu",
];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRate(ip)) {
    return Response.json(
      { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
      { status: 429 }
    );
  }

  let body: PendaftaranPayload;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  // Validate required fields
  const missing = REQUIRED_FIELDS.filter((k) => {
    const v = body[k];
    return v === undefined || v === null || v === "";
  });
  if (missing.length > 0) {
    return Response.json(
      { error: `Field wajib belum lengkap: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate format
  if (!/^\d{16,17}$/.test(body.nik)) {
    return Response.json({ error: "NIK tidak valid" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return Response.json({ error: "Email tidak valid" }, { status: 400 });
  }

  // Cek apakah email/NIK sudah ada pendaftaran berstatus pending
  try {
    const existingByNik = await getDocs(
      query(collection(db, "pendaftaran"), where("nik", "==", body.nik))
    );
    const blocked = existingByNik.docs.find((d) => {
      const s = d.data().status as string;
      return s === "submitted" || s === "diverifikasi" || s === "diterima";
    });
    if (blocked) {
      return Response.json(
        { error: "NIK ini sudah pernah mendaftar dan sedang/sudah diproses." },
        { status: 409 }
      );
    }
  } catch (err) {
    console.warn("Cek duplikat NIK gagal (lanjut):", err);
  }

  const now = Timestamp.now();
  try {
    const ref = await addDoc(collection(db, "pendaftaran"), {
      ...body,
      userId: null,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    });
    return Response.json({ ok: true, id: ref.id });
  } catch (err) {
    console.error("Gagal menyimpan pendaftaran:", err);
    return Response.json(
      { error: "Gagal menyimpan pendaftaran. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
