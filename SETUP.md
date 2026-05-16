# Setup Guide — Pendaftaran Asrama Mahasiswa Jambi Jakarta

## Cara Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

---

## Setup Firebase (WAJIB sebelum pakai)

### 1. Aktifkan Authentication
- Buka [Firebase Console](https://console.firebase.google.com)
- Project: `asrama-1cf5b`
- **Authentication → Sign-in method → Email/Password → Enable**

### 2. Buat Akun Admin
Di Firebase Console → Authentication → Add user:
- Email: `admin@asrama.com`
- Password: bebas (min 8 karakter)

Lalu di **Firestore → users** → Add document manual dengan ID = UID admin:
```json
{
  "uid": "<UID_admin>",
  "email": "admin@asrama.com",
  "displayName": "Admin Asrama",
  "role": "admin",
  "createdAt": <Timestamp sekarang>
}
```

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```
Atau copy isi `firestore.rules` ke Firebase Console → Firestore → Rules.

### 4. Deploy Storage Rules
Copy isi `storage.rules` ke Firebase Console → Storage → Rules.

### 5. Buat Firestore Indexes (jika diperlukan)
Firestore akan otomatis meminta index saat query pertama kali dijalankan.
Klik link yang muncul di console browser.

---

## Struktur Aplikasi

### Role
| Role | Akses |
|------|-------|
| `mahasiswa` | Isi formulir, lihat status, notifikasi, profil |
| `admin` | Dashboard stats, kelola pendaftar, kamar, penghuni, kirim notifikasi |

### Alur Pendaftaran
1. Mahasiswa **register** → akun dibuat dengan role `mahasiswa`
2. Mahasiswa isi **formulir pendaftaran** (bisa disimpan draft)
3. Mahasiswa **submit** formulir
4. Admin **verifikasi** → ubah status ke `diverifikasi`
5. Admin **terima** (pilih kamar) atau **tolak** (isi alasan)
6. Notifikasi otomatis dikirim ke mahasiswa

### Firestore Collections
- `users` — profil pengguna
- `pendaftaran` — data pendaftaran
- `kamar` — data kamar asrama
- `penghuni` — penghuni aktif
- `notifikasi` — notifikasi per user

---

## Tech Stack
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Firebase** (Auth + Firestore + Storage + Analytics)
- **React Hook Form + Zod** (validasi)
- **Lucide React** (icons)
