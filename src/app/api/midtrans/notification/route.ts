import { NextRequest } from "next/server";
import { Timestamp } from "firebase/firestore";
import { mapMidtransStatus, verifySignature } from "@/lib/midtrans";
import { setTagihanStatusByOrderId } from "@/lib/firestore";

/**
 * Webhook endpoint untuk Midtrans Payment Notification.
 * Daftarkan URL ini di Midtrans Dashboard → Settings → Configuration → Notification URL:
 *   https://<domain>/api/midtrans/notification
 */
export async function POST(req: NextRequest) {
  let payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
    transaction_id?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  // Verifikasi signature untuk anti-forgery
  const valid = await verifySignature(
    payload.order_id,
    payload.status_code,
    payload.gross_amount,
    payload.signature_key
  );
  if (!valid) {
    console.warn("Midtrans webhook: invalid signature", payload.order_id);
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  const status = mapMidtransStatus(payload.transaction_status, payload.fraud_status);

  const updated = await setTagihanStatusByOrderId(payload.order_id, status, {
    paymentType: payload.payment_type,
    ...(status === "lunas" ? { paidAt: Timestamp.now() } : {}),
  });

  if (!updated) {
    console.warn("Webhook: tagihan dengan orderId tidak ditemukan:", payload.order_id);
  }

  return Response.json({ ok: true });
}
