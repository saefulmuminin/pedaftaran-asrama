"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Sun, Moon, Loader2 } from "lucide-react";
import {
  fetchPrayerTimes,
  getUserLocation,
  buildSchedule,
  findNextPrayer,
  type PrayerSchedule,
  type UserLocation,
} from "@/lib/prayer-times";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

const NOTIF_LEAD_MS = 5 * 60 * 1000; // 5 menit sebelum

function fmtCountdown(ms: number): string {
  if (ms < 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function JadwalSholatWidget() {
  const { info, success } = useToast();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [schedule, setSchedule] = useState<PrayerSchedule[]>([]);
  const [now, setNow] = useState(Date.now());
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const loc = await getUserLocation();
        setLocation(loc);
        const data = await fetchPrayerTimes(loc.lat, loc.lng);
        setSchedule(buildSchedule(data.timings));
      } catch (err) {
        console.warn("Gagal load jadwal sholat:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Tick tiap 30 detik untuk countdown + cek notifikasi
  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setNow(t);

      schedule.forEach((p) => {
        const leadKey = `${p.name}-lead`;
        const adzanKey = `${p.name}-adzan`;
        const diff = p.timeMs - t;

        // 5 menit sebelum
        if (diff > 0 && diff <= NOTIF_LEAD_MS && !notifiedRef.current.has(leadKey)) {
          notifiedRef.current.add(leadKey);
          info(`5 menit lagi waktu ${p.label} (${p.time}). Bersiap-siap ya.`);
        }

        // Tepat saat adzan (window 60 detik agar tidak terlewat)
        if (diff <= 0 && diff > -60_000 && !notifiedRef.current.has(adzanKey)) {
          notifiedRef.current.add(adzanKey);
          success(`Waktu ${p.label} telah tiba (${p.time}). Hormati teman yang beribadah.`);
        }
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [schedule, info, success]);

  const next = useMemo(() => findNextPrayer(schedule), [schedule, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const countdown = next ? fmtCountdown(next.timeMs - now) : null;

  if (loading) {
    return (
      <Card className="p-6 border-none shadow-sm rounded-[2rem] bg-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
          <span className="text-sm font-bold text-slate-500">Memuat jadwal sholat...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 border-none shadow-premium rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-emerald-700 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Waktu Sholat</p>
            <h3 className="text-lg font-extrabold mt-1">Jadwal Hari Ini</h3>
          </div>
          {location && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">
              <MapPin className="w-3 h-3" />
              {location.source === "geolocation" ? "Lokasi Anda" : "Jakarta (default)"}
            </div>
          )}
        </div>

        {next && (
          <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Sholat Berikutnya
            </p>
            <div className="flex items-baseline justify-between mt-2 gap-3 flex-wrap">
              <div>
                <p className="text-2xl font-black">{next.label}</p>
                <p className="text-sm font-bold opacity-80">{next.time}</p>
              </div>
              <div className="font-mono font-black text-3xl tabular-nums">
                {countdown}
              </div>
            </div>
          </div>
        )}

        {!next && schedule.length > 0 && (
          <div className="p-4 bg-white/10 rounded-2xl text-xs font-bold text-center">
            Semua waktu sholat hari ini sudah lewat. Jadwal besok akan dimuat otomatis.
          </div>
        )}

        <div className="grid grid-cols-5 gap-2">
          {schedule.map((p) => {
            const passed = p.timeMs <= now;
            const isNext = next?.name === p.name;
            return (
              <div
                key={p.name}
                className={`text-center p-3 rounded-xl transition ${
                  isNext
                    ? "bg-white text-emerald-700 shadow-lg scale-105"
                    : passed
                    ? "bg-white/5 opacity-50"
                    : "bg-white/10"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {p.name === "Fajr" || p.name === "Isha" ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Sun className="w-3.5 h-3.5" />
                  )}
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider">{p.label}</p>
                <p className="text-xs font-bold mt-0.5">{p.time}</p>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-white/60 text-center font-medium">
          Sumber: aladhan.com (metode Kemenag RI) · Hormati teman yang sedang beribadah.
        </p>
      </div>
    </Card>
  );
}
