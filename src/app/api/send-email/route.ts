import nodemailer from "nodemailer";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { to, nama, nomorKamar, status, catatanAdmin } = await req.json();

  if (!to || !nama || !status) {
    return Response.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return Response.json(
      { error: "Konfigurasi email server belum lengkap" },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;

  let subject = "";
  let html = "";

  if (status === "diterima") {
    subject = "🎉 Selamat! Pendaftaran Asrama Anda Diterima";
    html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:40px 40px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:32px;">🏠</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Asrama Mahasiswa Jambi</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Jakarta</p>
    </div>

    <div style="padding:40px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:20px;text-align:center;margin-bottom:32px;">
        <span style="font-size:40px;">🎉</span>
        <h2 style="margin:12px 0 8px;color:#15803d;font-size:22px;font-weight:900;">Pendaftaran Diterima!</h2>
        <p style="margin:0;color:#166534;font-size:14px;">Selamat, Anda resmi menjadi calon penghuni asrama.</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;">Halo, <strong>${nama}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:8px;">
        Kami dengan bangga memberitahukan bahwa pendaftaran Anda untuk tinggal di
        <strong>Asrama Mahasiswa Jambi Jakarta</strong> telah <strong style="color:#15803d;">DITERIMA</strong>.
      </p>

      ${nomorKamar ? `
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:16px;padding:20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;color:#6d28d9;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;">Nomor Kamar Anda</p>
        <p style="margin:0;color:#4c1d95;font-size:36px;font-weight:900;">${nomorKamar}</p>
      </div>
      ` : ""}

      <div style="background:#f8fafc;border-radius:16px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;color:#374151;font-size:13px;font-weight:700;">Langkah Selanjutnya:</p>
        <ol style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
          <li>Login menggunakan email dan password yang Anda buat saat mendaftar.</li>
          <li>Lengkapi upload dokumen (Foto, KTP, KTM, Surat Aktif) di dashboard Anda.</li>
          <li>Konfirmasi kehadiran dengan menghubungi pengelola asrama.</li>
        </ol>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:16px 40px;border-radius:16px;font-size:15px;font-weight:800;letter-spacing:0.02em;">
          Login ke Dashboard →
        </a>
      </div>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
        Jika Anda tidak merasa mendaftar, abaikan email ini.
      </p>
    </div>

    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        © ${new Date().getFullYear()} Asrama Mahasiswa Jambi Jakarta ·
        <a href="${loginUrl}" style="color:#7c3aed;text-decoration:none;">Portal Mahasiswa</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  } else if (status === "ditolak") {
    subject = "Informasi Status Pendaftaran Asrama";
    html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:40px 40px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;">Asrama Mahasiswa Jambi</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:15px;line-height:1.7;">Halo, <strong>${nama}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.7;">
        Setelah meninjau data pendaftaran Anda, kami menyampaikan bahwa saat ini pendaftaran Anda
        <strong style="color:#dc2626;">belum dapat kami proses</strong>.
      </p>
      ${catatanAdmin ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#991b1b;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;">Keterangan</p>
        <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.7;">${catatanAdmin}</p>
      </div>
      ` : ""}
      <p style="color:#6b7280;font-size:14px;line-height:1.7;">
        Anda dapat mendaftar kembali pada periode pendaftaran berikutnya apabila ada kamar yang tersedia.
      </p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Asrama Mahasiswa Jambi Jakarta</p>
    </div>
  </div>
</body>
</html>`;
  }

  try {
    await transporter.sendMail({
      from: `"Asrama Mahasiswa Jambi" <${user}>`,
      to,
      subject,
      html,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Email send error:", err);
    return Response.json({ error: "Gagal mengirim email" }, { status: 500 });
  }
}
