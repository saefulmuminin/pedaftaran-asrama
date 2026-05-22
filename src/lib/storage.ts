// Base64-in-Firestore approach: foto disimpan sebagai data URL langsung di
// dokumen user/pendaftaran. Tidak butuh cloud storage eksternal.
//
// Trade-off:
//   - Maksimum 1 MB per dokumen Firestore. Karena itu kita resize + compress
//     sebelum menyimpan.
//   - Setiap kali dokumen dibaca, base64 ikut ter-load (kena read bandwidth).
//     Untuk avatar kecil ini tidak masalah; untuk dokumen pendaftaran agak
//     mahal tapi masih dalam batas wajar selama foto di-compress.

const AVATAR_MAX_SIZE = 256;
const AVATAR_QUALITY = 0.85;

const DOC_MAX_SIZE = 1024;
const DOC_QUALITY = 0.75;

async function readAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function compressImage(
  img: HTMLImageElement,
  maxSize: number,
  quality: number
): string {
  let { width, height } = img;
  if (width > height && width > maxSize) {
    height = Math.round((height * maxSize) / width);
    width = maxSize;
  } else if (height > maxSize) {
    width = Math.round((width * maxSize) / height);
    height = maxSize;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context tidak tersedia");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function fileToBase64(
  file: File,
  maxSize: number,
  quality: number
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar");
  }
  const img = await readAsImage(file);
  return compressImage(img, maxSize, quality);
}

export async function uploadFile(
  file: File,
  _path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(30);
  const dataURL = await fileToBase64(file, DOC_MAX_SIZE, DOC_QUALITY);
  onProgress?.(100);
  return dataURL;
}

// Tidak ada file eksternal yang perlu dihapus — base64 hidup di dalam dokumen
// Firestore. Ketika field di-overwrite atau di-clear, otomatis hilang.
export async function deleteFile(_url: string): Promise<void> {
  return;
}

export function generateFilePath(userId: string, type: string, _file: File): string {
  // Tidak terpakai untuk base64 storage, tapi tetap diekspor agar caller existing
  // (FileUpload, KTPScanner) tidak perlu diubah signature-nya.
  return `${userId}/${type}`;
}

export async function uploadProfilePhoto(
  file: File,
  _userId: string,
  _oldPhotoURL?: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(30);
  const dataURL = await fileToBase64(file, AVATAR_MAX_SIZE, AVATAR_QUALITY);
  onProgress?.(100);
  return dataURL;
}
