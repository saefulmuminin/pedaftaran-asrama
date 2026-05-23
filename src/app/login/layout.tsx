import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://asramajambi.com";

export const metadata: Metadata = {
  title: "Login Penghuni",
  description:
    "Masuk ke akun penghuni Asrama Mahasiswa Jambi Jakarta. Akses dashboard, status pendaftaran, tagihan, dan informasi asrama.",
  alternates: { canonical: `${SITE_URL}/login` },
  robots: {
    // Halaman login tidak perlu di-index secara prominent
    index: true,
    follow: true,
  },
  openGraph: {
    url: `${SITE_URL}/login`,
    title: "Login Penghuni - Asrama Mahasiswa Jambi Jakarta",
    description: "Masuk ke akun penghuni asrama.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
