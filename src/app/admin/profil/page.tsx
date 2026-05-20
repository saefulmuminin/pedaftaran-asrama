"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Shield, Save, Key, ShieldCheck, Calendar, BadgeCheck, Camera, Loader2, Trash2 } from "lucide-react";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import { uploadProfilePhoto, deleteFile } from "@/lib/storage";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

const profileSchema = z.object({
  displayName: z.string().min(3, "Nama minimal 3 karakter"),
  noHp: z.string().min(10, "No. HP tidak valid"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Wajib diisi"),
  newPassword: z.string().min(8, "Minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Password tidak sama", path: ["confirmPassword"] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AdminProfilPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { success, error } = useToast();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const currentUid = userProfile?.uid ?? user?.uid;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile || !currentUid) return;
    if (!file.type.startsWith("image/")) {
      error("File harus berupa gambar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      error("Ukuran foto maksimal 2MB.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const url = await uploadProfilePhoto(file, currentUid, userProfile.photoURL);
      await updateUserProfile(currentUid, { photoURL: url });
      await refreshProfile();
      success("Foto profil berhasil diperbarui!");
    } catch (err) {
      console.error("Upload foto gagal:", err);
      error("Gagal mengunggah foto.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handlePhotoRemove = async () => {
    if (!userProfile || !currentUid) return;
    setUploadingPhoto(true);
    try {
      const oldUrl = userProfile.photoURL;
      await updateUserProfile(currentUid, { photoURL: "" });
      if (oldUrl) {
        try {
          await deleteFile(oldUrl);
        } catch (err) {
          console.warn("Gagal menghapus file foto profil:", err);
        }
      }
      await refreshProfile();
      success("Foto profil dihapus.");
    } catch (err) {
      console.error("Hapus foto gagal:", err);
      error("Gagal menghapus foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: userProfile?.displayName ?? "", noHp: userProfile?.noHp ?? "" },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data: ProfileForm) => {
    if (!userProfile || !currentUid) return;
    setSavingProfile(true);
    try {
      await updateUserProfile(currentUid, data);
      await refreshProfile();
      success("Profil berhasil diperbarui!");
    } catch (err) {
      console.error("Update profil gagal:", err);
      error("Gagal memperbarui profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    setSavingPassword(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, data.newPassword);
      success("Password berhasil diubah!");
      passwordForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        error("Password lama salah.");
      } else {
        error("Gagal mengubah password.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-bottom duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pengaturan Profil</h1>
          <p className="text-slate-500 font-medium">Kelola informasi pribadi dan keamanan administrator sistem.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-[13px] font-bold text-slate-600">
          <ShieldCheck className="w-4.5 h-4.5 text-primary-500" />
          Secure Admin Session
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Info */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <BadgeCheck className="w-24 h-24" />
            </div>
            
            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="relative">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="w-32 h-32 bg-primary-50 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-primary-100 overflow-hidden text-primary-600">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName ?? "Foto profil"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white text-white transition-all"
                  aria-label="Ubah foto profil"
                >
                  {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
              </div>

              {userProfile?.photoURL && !uploadingPhoto && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Foto
                </button>
              )}

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{userProfile?.displayName}</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full border border-primary-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Main Administrator</span>
                </div>
              </div>

              <div className="w-full space-y-4 pt-4 text-left">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Terdaftar</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary-500" /> {userProfile?.email}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Terdaftar Sejak</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500" /> {formatDate(userProfile?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none bg-slate-900 text-white rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Shield className="w-12 h-12" />
            </div>
            <div className="relative z-10 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">Security Note</p>
              <p className="text-xs font-medium leading-relaxed opacity-80">
                Akun ini memiliki hak akses penuh ke seluruh data pendaftaran dan manajemen sistem. Jaga kerahasiaan password Anda.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Info */}
            <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem] flex flex-col">
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Detail Informasi</h3>
              </div>
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-6 flex-1 flex flex-col">
                <Input
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  error={profileForm.formState.errors.displayName?.message}
                  required
                  {...profileForm.register("displayName")}
                  className="rounded-2xl"
                />
                <Input
                  label="Nomor WhatsApp"
                  type="tel"
                  placeholder="0812..."
                  error={profileForm.formState.errors.noHp?.message}
                  required
                  {...profileForm.register("noHp")}
                  className="rounded-2xl"
                />
                <div className="flex-1" />
                <Button type="submit" loading={savingProfile} icon={<Save className="w-5 h-5" />} className="w-full rounded-2xl font-bold py-6 shadow-xl shadow-primary-500/10">
                  Simpan Perubahan
                </Button>
              </form>
            </Card>

            {/* Security */}
            <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Keamanan Akun</h3>
              </div>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                <Input
                  label="Password Saat Ini"
                  type="password"
                  placeholder="••••••••"
                  error={passwordForm.formState.errors.currentPassword?.message}
                  required
                  {...passwordForm.register("currentPassword")}
                  className="rounded-2xl"
                />
                <div className="space-y-4">
                  <Input
                    label="Password Baru"
                    type="password"
                    placeholder="••••••••"
                    error={passwordForm.formState.errors.newPassword?.message}
                    required
                    {...passwordForm.register("newPassword")}
                    className="rounded-2xl"
                  />
                  <Input
                    label="Ulangi Password Baru"
                    type="password"
                    placeholder="••••••••"
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    required
                    {...passwordForm.register("confirmPassword")}
                    className="rounded-2xl"
                  />
                </div>
                <Button type="submit" loading={savingPassword} variant="secondary" className="w-full rounded-2xl font-bold py-6 shadow-xl shadow-slate-200">
                  Update Password
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
