import { NextRequest } from "next/server";
import { chargeCore } from "@/lib/midtrans";

/**
 * Core API charge — return data mentah untuk render custom payment UI di client.
 * Tidak menyentuh Firestore (client yang update).
 */
export async function POST(req: NextRequest) {
  let body: {
    tagihanId: string;
    jumlah: number;
    judul: string;
    periode: string;
    namaLengkap: string;
    email: string;
    method: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const { tagihanId, jumlah, judul, periode, namaLengkap, email, method } = body;
  if (!tagihanId || !jumlah || !judul || !periode || !namaLengkap || !email || !method) {
    return Response.json({ error: "Field wajib belum lengkap" }, { status: 400 });
  }
  if (jumlah <= 0) {
    return Response.json({ error: "Jumlah harus > 0" }, { status: 400 });
  }

  const orderId = `ASRAMA-${tagihanId}-${Date.now()}`;

  try {
    const result = await chargeCore({
      orderId,
      grossAmount: jumlah,
      customer: { first_name: namaLengkap, email },
      itemDetails: [
        {
          id: tagihanId,
          name: `${judul} - ${periode}`,
          price: jumlah,
          quantity: 1,
        },
      ],
      method,
    });

    return Response.json({
      orderId,
      ...result,
    });
  } catch (err) {
    console.error("Charge gagal:", err);
    const msg = err instanceof Error ? err.message : "Error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
