import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Pendaftaran Asrama Mahasiswa Jambi Jakarta",
  description:
    "Sistem Informasi Pendaftaran Asrama Mahasiswa Jambi di Jakarta — daftar secara online, mudah, cepat, dan transparan.",
  keywords: ["asrama", "mahasiswa", "Jambi", "Jakarta", "pendaftaran"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
