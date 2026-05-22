import { NextRequest } from "next/server";
import { Timestamp } from "firebase/firestore";
import { getTransactionStatus, mapMidtransStatus } from "@/lib/midtrans";
import { setTagihanStatusByOrderId } from "@/lib/firestore";

/**
 * Fallback endpoint untuk client setelah Snap callback.
 * Karena dev (localhost) tidak bisa menerima webhook dari Midtrans secara langsung,
 * client memanggil endpoint ini setelah popup Snap close untuk re-fetch status
 * dari Midtrans dan sync ke Firestore.
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

    await setTagihanStatusByOrderId(body.orderId, status, {
      paymentType: result.payment_type,
      ...(status === "lunas" ? { paidAt: Timestamp.now() } : {}),
    });

    return Response.json({ status, transactionStatus: result.transaction_status });
  } catch (err) {
    console.error("Verify payment gagal:", err);
    const msg = err instanceof Error ? err.message : "Error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
