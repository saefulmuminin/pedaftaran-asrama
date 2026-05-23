import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://asramajambi.com";

export const metadata: Metadata = {
  title: "Tata Tertib Asrama",
  description:
    "Tata tertib resmi Asrama Mahasiswa Jambi Jakarta — kewajiban penghuni, larangan, dan sanksi pelanggaran. Wajib dibaca calon dan penghuni asrama.",
  keywords: [
    "tata tertib asrama",
    "peraturan asrama mahasiswa",
    "kewajiban penghuni asrama",
    "larangan asrama jambi",
  ],
  alternates: { canonical: `${SITE_URL}/tata-tertib` },
  openGraph: {
    url: `${SITE_URL}/tata-tertib`,
    title: "Tata Tertib Asrama Mahasiswa Jambi Jakarta",
    description:
      "Kewajiban & larangan resmi bagi penghuni Asrama Mahasiswa Jambi Jakarta.",
    type: "article",
  },
};

export default function TataTertibLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
