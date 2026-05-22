// Wrapper untuk Aladhan API (gratis, no key) — https://api.aladhan.com
// Pakai metode 20 (Kemenag Indonesia) sebagai default.

export interface PrayerTimes {
  Fajr: string;    // Subuh
  Sunrise: string; // Syuruq (sunrise)
  Dhuhr: string;   // Zuhur
  Asr: string;     // Asar
  Maghrib: string; // Magrib
  Isha: string;    // Isya
}

export interface PrayerData {
  timings: PrayerTimes;
  date: { readable: string; timestamp: string };
  meta: { latitude: number; longitude: number; timezone: string };
}

const ALADHAN_METHOD_KEMENAG = 20;

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date()
): Promise<PrayerData> {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=${ALADHAN_METHOD_KEMENAG}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Aladhan API error ${res.status}`);
  const json = await res.json() as { data: PrayerData };
  return json.data;
}

export interface UserLocation {
  lat: number;
  lng: number;
  source: "geolocation" | "fallback";
}

const JAKARTA_FALLBACK: UserLocation = { lat: -6.2088, lng: 106.8456, source: "fallback" };

export function getUserLocation(timeoutMs = 8000): Promise<UserLocation> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      resolve(JAKARTA_FALLBACK);
      return;
    }
    const timer = setTimeout(() => resolve(JAKARTA_FALLBACK), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "geolocation",
        });
      },
      () => {
        clearTimeout(timer);
        resolve(JAKARTA_FALLBACK);
      },
      { timeout: timeoutMs, maximumAge: 60 * 60 * 1000 }
    );
  });
}

export interface PrayerSchedule {
  name: string;
  label: string;
  time: string; // HH:MM
  timeMs: number;
}

const SHALAT_5: { key: keyof PrayerTimes; label: string }[] = [
  { key: "Fajr", label: "Subuh" },
  { key: "Dhuhr", label: "Zuhur" },
  { key: "Asr", label: "Asar" },
  { key: "Maghrib", label: "Magrib" },
  { key: "Isha", label: "Isya" },
];

export function buildSchedule(timings: PrayerTimes, baseDate: Date = new Date()): PrayerSchedule[] {
  return SHALAT_5.map(({ key, label }) => {
    const time = timings[key].slice(0, 5); // "04:35 (WIB)" -> "04:35"
    const [h, m] = time.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return { name: key, label, time, timeMs: d.getTime() };
  });
}

/**
 * Cari sholat berikutnya. Kalau semua sudah lewat hari ini, return null.
 */
export function findNextPrayer(schedule: PrayerSchedule[]): PrayerSchedule | null {
  const now = Date.now();
  return schedule.find((p) => p.timeMs > now) ?? null;
}
