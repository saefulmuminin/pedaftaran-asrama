import { NextRequest } from "next/server";
import { Timestamp } from "firebase/firestore";
import { createSnapTransaction } from "@/lib/midtrans";
import { getTagihanById, updateTagihan, formatPeriode } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  let body: { tagihanId: string; email: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const { tagihanId, email } = body;
  if (!tagihanId || !email) {
    return Response.json({ error: "tagihanId & email wajib diisi" }, { status: 400 });
  }

  const tagihan = await getTagihanById(tagihanId);
  if (!tagihan) {
    return Response.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  }
  if (tagihan.status === "lunas") {
    return Response.json({ error: "Tagihan sudah lunas" }, { status: 400 });
  }

  // Order ID: unique per attempt. Pakai timestamp untuk handle retry setelah expire.
  const orderId = `ASRAMA-${tagihan.id}-${Date.now()}`;

  // Finish URL — Midtrans append ?order_id=... &transaction_status=... otomatis.
  // Handler di /mahasiswa/tagihan baca query param dan sync ke Firestore.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const finishUrl = `${appUrl}/mahasiswa/tagihan`;

  try {
    const snap = await createSnapTransaction({
      orderId,
      grossAmount: tagihan.jumlah,
      customer: {
        first_name: tagihan.namaLengkap,
        email,
      },
      itemDetails: [
        {
          id: tagihan.id,
          name: `${tagihan.judul ?? "Iuran Bulanan"} - ${formatPeriode(tagihan.periode)}`,
          price: tagihan.jumlah,
          quantity: 1,
        },
      ],
      finishUrl,
    });

    // Simpan orderId & token ke tagihan untuk tracking
    await updateTagihan(tagihan.id, {
      midtransOrderId: orderId,
      midtransToken: snap.token,
      status: "pending",
      expiredAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
    });

    return Response.json({ token: snap.token, orderId });
  } catch (err) {
    console.error("Create snap transaction gagal:", err);
    const msg = err instanceof Error ? err.message : "Error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
