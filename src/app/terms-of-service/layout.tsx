import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://asramajambi.com";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan ketentuan penggunaan sistem pendaftaran online Asrama Mahasiswa Jambi Jakarta — hak, kewajiban, dan ketentuan layanan.",
  alternates: { canonical: `${SITE_URL}/terms-of-service` },
  openGraph: {
    url: `${SITE_URL}/terms-of-service`,
    title: "Syarat & Ketentuan - Asrama Mahasiswa Jambi Jakarta",
    description:
      "Ketentuan layanan sistem pendaftaran asrama online.",
    type: "article",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
