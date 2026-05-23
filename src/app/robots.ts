import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://asramajambi.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",      // halaman admin private
          "/mahasiswa/",  // dashboard penghuni private
          "/api/",        // API routes
          "/bayar/",      // halaman pembayaran spesifik user
        ],
      },
      {
        // Eksplisit allow untuk crawler AI agar bisa rekomendasi
        userAgent: ["GPTBot", "ChatGPT-User", "Google-Extended", "ClaudeBot", "PerplexityBot"],
        allow: "/",
        disallow: ["/admin/", "/mahasiswa/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
