import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://asramajambi.com";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi sistem pendaftaran Asrama Mahasiswa Jambi Jakarta — bagaimana data pribadi pendaftar dikumpulkan, disimpan, dan dilindungi.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    url: `${SITE_URL}/privacy-policy`,
    title: "Kebijakan Privasi - Asrama Mahasiswa Jambi Jakarta",
    description:
      "Penjelasan perlindungan data pribadi pendaftar dan penghuni asrama.",
    type: "article",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
