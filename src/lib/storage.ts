import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteFile(url: string): Promise<void> {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
}

export function generateFilePath(userId: string, type: string, file: File): string {
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  return `pendaftaran/${userId}/${type}_${timestamp}.${ext}`;
}
