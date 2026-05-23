import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://asramajambi.com";

export const metadata: Metadata = {
  title: "Pendaftaran Penghuni Asrama",
  description:
    "Formulir pendaftaran online Asrama Mahasiswa Jambi Jakarta. Isi data biodata, akademik, kontak, dan upload KTP — proses cepat & transparan, tanpa perlu datang ke lokasi.",
  keywords: [
    "pendaftaran asrama jambi",
    "formulir asrama mahasiswa",
    "daftar asrama jakarta",
    "pendaftaran online asrama",
  ],
  alternates: { canonical: `${SITE_URL}/daftar` },
  openGraph: {
    url: `${SITE_URL}/daftar`,
    title: "Pendaftaran Penghuni Asrama Mahasiswa Jambi Jakarta",
    description:
      "Daftar sebagai calon penghuni Asrama Mahasiswa Jambi Jakarta secara online — gratis, cepat, dan transparan.",
    type: "website",
  },
};

export default function DaftarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
