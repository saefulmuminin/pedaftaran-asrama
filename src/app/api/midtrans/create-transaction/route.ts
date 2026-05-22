import { NextRequest } from "next/server";
import { createSnapTransaction } from "@/lib/midtrans";

/**
 * Buat Midtrans Snap transaction. Client harus kirim semua data tagihan
 * yang dibutuhkan — kita tidak baca Firestore di sini karena Firebase
 * client SDK tidak reliable di Node.js server runtime.
 *
 * Client bertanggung jawab untuk:
 *  1. Validasi user memang owner tagihan (sudah di-handle Firestore rules)
 *  2. Update tagihan doc dengan midtransOrderId/Token setelah dapat response.
 */
export async function POST(req: NextRequest) {
  let body: {
    tagihanId: string;
    jumlah: number;
    judul: string;
    periode: string;
    namaLengkap: string;
    email: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const { tagihanId, jumlah, judul, periode, namaLengkap, email } = body;
  if (!tagihanId || !jumlah || !judul || !periode || !namaLengkap || !email) {
    return Response.json({ error: "Field wajib belum lengkap" }, { status: 400 });
  }
  if (jumlah <= 0) {
    return Response.json({ error: "Jumlah harus > 0" }, { status: 400 });
  }

  const orderId = `ASRAMA-${tagihanId}-${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const finishUrl = `${appUrl}/mahasiswa/tagihan`;

  try {
    const snap = await createSnapTransaction({
      orderId,
      grossAmount: jumlah,
      customer: {
        first_name: namaLengkap,
        email,
      },
      itemDetails: [
        {
          id: tagihanId,
          name: `${judul} - ${periode}`,
          price: jumlah,
          quantity: 1,
        },
      ],
      finishUrl,
    });

    return Response.json({ token: snap.token, orderId });
  } catch (err) {
    console.error("Create snap transaction gagal:", err);
    const msg = err instanceof Error ? err.message : "Error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
