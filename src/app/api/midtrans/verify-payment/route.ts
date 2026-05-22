import { NextRequest } from "next/server";
import { getTransactionStatus, mapMidtransStatus } from "@/lib/midtrans";

/**
 * Cek status transaksi dari Midtrans. Tidak menyentuh Firestore — client
 * yang akan update dokumen tagihan berdasarkan response ini, karena client
 * punya auth context yang dibutuhkan Firestore rules.
 */
export async function POST(req: NextRequest) {
  let body: { orderId: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  if (!body.orderId) {
    return Response.json({ error: "orderId wajib diisi" }, { status: 400 });
  }

  try {
    const result = await getTransactionStatus(body.orderId);
    const status = mapMidtransStatus(result.transaction_status, result.fraud_status);

    return Response.json({
      status,                                  // status internal: lunas/pending/expired/cancelled/unpaid
      transactionStatus: result.transaction_status, // raw dari Midtrans
      paymentType: result.payment_type,
      grossAmount: result.gross_amount,
    });
  } catch (err) {
    console.error("Verify payment gagal:", err);
    const msg = err instanceof Error ? err.message : "Error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
