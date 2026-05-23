import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://asramajambi.com";
const SITE_NAME = "Asrama Mahasiswa Jambi Jakarta";
const SITE_DESC =
  "Sistem Informasi Pendaftaran Asrama Mahasiswa Jambi di Jakarta — daftar secara online, mudah, cepat, dan transparan. Dikelola Pemerintah Provinsi Jambi untuk mahasiswa Jambi yang menuntut ilmu di Jakarta.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  authors: [{ name: "Pemerintah Provinsi Jambi" }],
  creator: "Pemerintah Provinsi Jambi",
  publisher: "Pemerintah Provinsi Jambi",
  keywords: [
    "asrama mahasiswa jambi",
    "asrama jambi jakarta",
    "pendaftaran asrama mahasiswa",
    "hunian mahasiswa jakarta",
    "mahasiswa jambi di jakarta",
    "pemprov jambi",
    "asrama murah jakarta",
    "kos mahasiswa jambi",
    "tempat tinggal mahasiswa jambi",
  ],
  category: "education",
  alternates: {
    canonical: SITE_URL,
    languages: { "id-ID": SITE_URL },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Logo Asrama Mahasiswa Jambi Jakarta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  verification: {
    google: "hvP8a1ZHjV8CRY3rMndLiVWgjwuNRpCAQldREgpYDVA",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}#organization`,
  name: SITE_NAME,
  alternateName: "Asrama Jambi",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESC,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Jakarta",
    addressCountry: "ID",
  },
  parentOrganization: {
    "@type": "GovernmentOrganization",
    name: "Pemerintah Provinsi Jambi",
  },
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESC,
  publisher: { "@id": `${SITE_URL}#organization` },
  inLanguage: "id-ID",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full bg-gray-50">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
