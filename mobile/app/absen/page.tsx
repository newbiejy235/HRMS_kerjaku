"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MapPin,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  RefreshCw,
  Smartphone,
  Clock,
  Loader2,
  X,
  LogIn,
  LogOut,
  Send,
  Keyboard,
} from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import {
  dashboardService,
  ApiError,
  AttendanceSubmitPayload,
} from "../../lib/services/dashboardService";
import { getToken } from "../../lib/auth";

/* ----------------------------- Types ----------------------------- */

type PageView = "dashboard" | "scanning" | "location" | "result" | "error";

type AttendanceStatus =
  | "on time"
  | "tolerance time"
  | "late"
  | "pending"
  | "absent";

interface AttendanceRecord {
  shiftDate: string;
  employeeIn?: string;
  employeeOut?: string;
  status?: AttendanceStatus;
  employeeLocate?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface SubmitResult {
  success: boolean;
  message: string;
  data?: {
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: string;
    distance: number;
    allowedRadius: number;
  };
}

/* ---------------------------- Constants ---------------------------- */

const READER_ID = "qr-reader";
const MIN_GPS_ACCURACY = 100; // meters
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ----------------------------- Helpers ----------------------------- */

const formatStatusLabel = (status?: string): string => {
  switch (status) {
    case "on time":
      return "Tepat Waktu";
    case "tolerance time":
      return "Terlambat (Toleransi)";
    case "late":
      return "Terlambat";
    case "pending":
      return "Menunggu";
    case "absent":
      return "Tidak Hadir";
    default:
      return "-";
  }
};

const statusBadgeClass = (status?: string): string => {
  switch (status) {
    case "on time":
      return "text-emerald-700 bg-emerald-50 border-emerald-300";
    case "tolerance time":
      return "text-amber-700 bg-amber-50 border-amber-300";
    case "late":
    case "absent":
      return "text-rose-700 bg-rose-50 border-rose-300";
    default:
      return "text-neutral-600 bg-[#FAF7F2] border-neutral-300";
  }
};

/**
 * Ambil token dari isi QR. Kalau QR berisi token polos (format yang dipakai BE),
 * dipakai apa adanya. Kalau berisi JSON {"token": "..."} atau URL ?token=...,
 * token-nya diambil dari situ.
 */
const extractQrToken = (raw: string): string => {
  const text = raw.trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.token === "string") return parsed.token.trim();
  } catch {
    // bukan JSON
  }
  try {
    const fromUrl = new URL(text).searchParams.get("token");
    if (fromUrl) return fromUrl.trim();
  } catch {
    // bukan URL
  }
  return text;
};

/** Pesan error absensi; khusus di luar radius, tampilkan jarak dari BE */
const getAttendanceErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    const d = err.data as
      | { employeeDistance?: number; allowedRadius?: number }
      | undefined;
    if (err.status === 403 && typeof d?.employeeDistance === "number") {
      return `Anda berada di luar jangkauan lokasi toko. Jarak kamu ${d.employeeDistance} m dari toko, batas ${d.allowedRadius} m.`;
    }
    return err.message;
  }
  return err instanceof Error && err.message
    ? err.message
    : "Terjadi kesalahan saat absensi";
};

/* ------------------------- Small UI pieces ------------------------- */

const CARD =
  "bg-white border-2 border-neutral-900 rounded-3xl shadow-[2px_2px_0px_0px_#171717]";
const BTN_BASE =
  "w-full inline-flex items-center justify-center gap-2 rounded-full border-2 font-bold text-sm transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2";
const BTN_PRIMARY = `${BTN_BASE} py-4 px-6 bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800`;
const BTN_SECONDARY = `${BTN_BASE} py-3 px-4 bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900`;
const BTN_DISABLED = `${BTN_BASE} py-4 px-6 bg-neutral-300 text-neutral-500 border-neutral-300 cursor-not-allowed`;

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-neutral-300">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-neutral-500">{label}</p>
        <p className="text-sm font-black text-neutral-900 truncate">{value}</p>
      </div>
      {icon}
    </div>
  );
}

const STEPS = ["Scan QR", "Cek lokasi", "Kirim"];

function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 mb-4" aria-label="Langkah absensi">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={`shrink-0 w-6 h-6 rounded-full border-2 text-[11px] font-black flex items-center justify-center ${
                done
                  ? "bg-neutral-900 border-neutral-900 text-white"
                  : active
                    ? "bg-white border-neutral-900 text-neutral-900"
                    : "bg-white border-neutral-300 text-neutral-400"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-[11px] font-bold truncate ${
                active || done ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function AbsenPage() {
  const [view, setView] = useState<PageView>("dashboard");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [resultData, setResultData] = useState<SubmitResult | null>(null);
  const [todayAttendance, setTodayAttendance] =
    useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false); // callback bisa kepanggil berkali-kali sebelum stop selesai
  const sessionRef = useRef(0); // penanda sesi scanner, biar start yang basi bisa dibatalkan
  const submitLockRef = useRef(false);

  /* ---------- Jam realtime ---------- */
  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("id-ID", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------- Data absensi hari ini (sama seperti sebelumnya) ---------- */
  // const loadTodayAttendance = useCallback(async () => {
  //   try {
  //     const authToken = typeof window !== "undefined" ? getToken() : null;

  //     const res = await fetch(`${API_URL}/attendance`, {
  //       headers: {
  //         Authorization: `Bearer ${authToken ?? ""}`,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     if (res.ok) {
  //       const data = await res.json();
  //       const records: AttendanceRecord[] = data.data || [];
  //       const today = new Date().toLocaleDateString("sv-SE", {
  //         timeZone: "Asia/Jakarta",
  //       });
  //       const todayRecord = records.find((r) => r.shiftDate === today);
  //       setTodayAttendance(todayRecord || null);
  //     }
  //   } catch {
  //     // Silent fail - riwayat absensi hanya pelengkap
  //   }
  // }, []);

  // useEffect(() => {
  //   loadTodayAttendance();
  // }, [loadTodayAttendance]);

  /* ---------- Scanner (html5-qrcode) ---------- */
  const stopScanner = useCallback(async () => {
    sessionRef.current += 1;
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setIsCameraReady(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop(); // stop() throw kalau belum jalan
      scanner.clear();
    } catch {
      // abaikan error stop
    }
  }, []);

  const startScanner = useCallback(async () => {
    setScanError(null);
    handledRef.current = false;
    const session = ++sessionRef.current;

    try {
      // dynamic import biar aman dari masalah SSR di Next.js
      const { Html5Qrcode } = await import("html5-qrcode");
      if (session !== sessionRef.current) return;

      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // kamera belakang
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText, decodedResult) => {
          if (handledRef.current) return;
          handledRef.current = true;

          console.log("QR text:", decodedText); // <-- data QR-nya
          console.log("QR full result:", decodedResult);

          setQrToken(extractQrToken(decodedText));
          await stopScanner();
          setView("location");
        },
        () => {
          // dipanggil tiap frame yang belum ketemu QR, abaikan
        },
      );

      if (session !== sessionRef.current) {
        // user sudah keluar dari view scanning saat kamera masih menyala
        try {
          if (scanner.isScanning) await scanner.stop();
          scanner.clear();
        } catch {
          // abaikan
        }
        return;
      }
      setIsCameraReady(true);
    } catch (err: any) {
      scannerRef.current = null;
      setIsCameraReady(false);
      setScanError(
        err?.message ||
          "Tidak bisa mengakses kamera. Cek izin kamera di browser, atau pakai input manual.",
      );
    }
  }, [stopScanner]);

  // Mulai scanner setelah view "scanning" ter-render (div #qr-reader harus sudah ada di DOM)
  useEffect(() => {
    if (view !== "scanning") return;
    startScanner();
    return () => {
      stopScanner();
    };
  }, [view, startScanner, stopScanner]);

  /* ---------- Lokasi ---------- */
  const getLocation = useCallback(() => {
    setIsGettingLocation(true);
    setSubmitError(null);

    if (!navigator.geolocation) {
      setIsGettingLocation(false);
      setSubmitError("Peramban HP kamu tidak mendukung fitur lokasi.");
      setView("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setSubmitError(
            "Izin lokasi ditolak. Aktifkan GPS di pengaturan HP dan coba lagi.",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setSubmitError(
            "Lokasi tidak tersedia. Pastikan GPS aktif dan coba lagi.",
          );
        } else if (error.code === error.TIMEOUT) {
          setSubmitError("Pengambilan lokasi timeout. Coba lagi.");
        } else {
          setSubmitError("Tidak dapat mengakses lokasi HP.");
        }
        setView("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  // Ambil lokasi otomatis begitu masuk view "location"
  useEffect(() => {
    if (view === "location" && !locationData && !isGettingLocation) {
      getLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  /* ---------- Submit ---------- */
  const submitAttendance = async () => {
    if (submitLockRef.current) return;
    if (!qrToken || !locationData) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    const payload: AttendanceSubmitPayload = {
      token: qrToken,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    };

    try {
      const res: SubmitResult =
        await dashboardService.submitAttendance(payload);

      if (!res.success) {
        setSubmitError(res.message || "Absensi ditolak oleh server.");
        setView("error");
        return;
      }

      setResultData(res);
      setView("result");
      // await loadTodayAttendance();
    } catch (err: any) {
      setSubmitError(getAttendanceErrorMessage(err));
      setView("error");
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  /* ---------- Navigasi ---------- */
  const resetFlow = () => {
    setResultData(null);
    setQrToken(null);
    setLocationData(null);
    setSubmitError(null);
    setScanError(null);
    setManualToken("");
  };

  const goScan = () => {
    resetFlow();
    setView("scanning");
  };

  const backToDashboard = () => {
    resetFlow();
    setView("dashboard");
  };

  const useManualToken = () => {
    const token = extractQrToken(manualToken);
    if (!token) return;
    setQrToken(token);
    setLocationData(null);
    setView("location");
  };

  const retryLocation = () => {
    setSubmitError(null);
    setLocationData(null);
    setView("location"); // effect di atas yang akan ambil lokasi lagi
  };

  const retrySubmit = () => {
    setSubmitError(null);
    setView("location");
    submitAttendance();
  };

  /* ------------------------------ UI ------------------------------ */

  return (
    <PlaceholderLayout
      title="Absensi Kehadiran"
      subtitle="Presensi masuk dan pulang kerja outlet"
      badge="GPS & QR"
    >
      <div className="flex-1 flex flex-col gap-4">
        {/* ===================== DASHBOARD ===================== */}
        {view === "dashboard" && (
          <>
            {/* <section className={`${CARD} p-5`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-neutral-500">
                    Hari ini
                  </p>
                  <p
                    className="text-3xl font-black font-mono tracking-tight text-neutral-900 tabular-nums"
                    suppressHydrationWarning
                  >
                    {currentTime || "--:--:--"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full border text-xs font-bold ${
                    todayAttendance
                      ? statusBadgeClass(todayAttendance.status)
                      : "text-neutral-600 bg-[#FAF7F2] border-neutral-300"
                  }`}
                >
                  {todayAttendance
                    ? formatStatusLabel(todayAttendance.status)
                    : "Belum absen"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoTile
                  label="Jam masuk"
                  value={todayAttendance?.employeeIn || "-"}
                  icon={<LogIn className="w-4 h-4 text-neutral-400" />}
                />
                <InfoTile
                  label="Jam pulang"
                  value={todayAttendance?.employeeOut || "-"}
                  icon={<LogOut className="w-4 h-4 text-neutral-400" />}
                />
              </div>

              <div className="mt-3">
                <InfoTile
                  label="Lokasi terakhir"
                  value={todayAttendance?.employeeLocate || "-"}
                  icon={<MapPin className="w-4 h-4 text-neutral-400" />}
                />
              </div>
            </section> */}

            <div className="space-y-2">
              <button type="button" onClick={goScan} className={BTN_PRIMARY}>
                <Smartphone className="w-4 h-4" />
                Scan QR Code
              </button>
              <p className="text-xs text-center text-neutral-500">
                Arahkan kamera ke QR Code outlet. Pastikan GPS aktif dan kamu
                berada di area outlet.
              </p>
            </div>

            {/* Fallback input manual */}
            <details className={`${CARD} group`}>
              <summary className="flex items-center gap-2 p-4 cursor-pointer list-none text-sm font-bold text-neutral-900 [&::-webkit-details-marker]:hidden">
                <Keyboard className="w-4 h-4" />
                Kamera bermasalah? Input kode manual
              </summary>
              <div className="px-4 pb-4 space-y-3">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Masukkan kode QR outlet"
                  className="w-full py-3 px-4 rounded-full bg-[#FAF7F2] text-neutral-900 placeholder-neutral-400 font-medium text-base border-2 border-neutral-300 focus:border-neutral-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={useManualToken}
                  disabled={!manualToken.trim()}
                  className={manualToken.trim() ? BTN_PRIMARY : BTN_DISABLED}
                >
                  <MapPin className="w-4 h-4" />
                  Gunakan kode ini
                </button>
              </div>
            </details>
          </>
        )}

        {/* ===================== SCANNING ===================== */}
        {view === "scanning" && (
          <section className={`${CARD} p-4`}>
            <Stepper current={0} />

            <h3 className="text-sm font-extrabold text-neutral-900">
              Scan QR Code outlet
            </h3>
            <p className="text-xs text-neutral-600 mb-3">
              Arahkan kamera ke layar QR Code outlet tempat kamu bertugas.
            </p>

            {/* #qr-reader dikelola penuh oleh html5-qrcode: jangan isi child / innerHTML */}
            <div className="relative w-full aspect-square rounded-2xl border-2 border-neutral-900 bg-neutral-900 overflow-hidden">
              <div id={READER_ID} className="w-full h-full" />

              {!isCameraReady && !scanError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#FAF7F2] pointer-events-none">
                  <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
                  <span className="text-xs font-medium text-neutral-600">
                    Menyalakan kamera… izinkan akses kamera jika diminta
                  </span>
                </div>
              )}

              {scanError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#FAF7F2] p-4 text-center">
                  <QrCode className="w-8 h-8 text-neutral-400" />
                  <span className="text-xs text-rose-800 font-medium">
                    {scanError}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {scanError && (
                <button
                  type="button"
                  onClick={startScanner}
                  className={BTN_PRIMARY}
                >
                  <RefreshCw className="w-4 h-4" />
                  Coba lagi
                </button>
              )}
              <button
                type="button"
                onClick={backToDashboard}
                className={BTN_SECONDARY}
              >
                <X className="w-4 h-4" />
                Tutup scanner
              </button>
            </div>
          </section>
        )}

        {/* ===================== LOCATION ===================== */}
        {view === "location" && (
          <section className={`${CARD} p-4`}>
            <Stepper current={isGettingLocation || !locationData ? 1 : 2} />

            <h3 className="text-sm font-extrabold text-neutral-900">
              {locationData ? "Siap dikirim" : "Mengambil lokasi"}
            </h3>
            <p className="text-xs text-neutral-600 mb-4">
              Sistem memeriksa apakah kamu berada di dalam radius outlet.
              Pastikan GPS HP aktif.
            </p>

            <div className="space-y-3">
              <InfoTile
                label="Kode QR"
                value={<span className="font-mono text-xs">{qrToken}</span>}
                icon={<QrCode className="w-4 h-4 text-neutral-400" />}
              />

              {isGettingLocation && (
                <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#FAF7F2] border border-neutral-300 text-sm font-bold text-neutral-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengambil lokasi GPS…
                </div>
              )}

              {!isGettingLocation && locationData && (
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-neutral-300">
                  <p className="text-[11px] font-semibold text-neutral-500">
                    Lokasi ditemukan
                  </p>
                  <p className="text-xs font-mono text-neutral-900 break-all">
                    {locationData.latitude.toFixed(6)},{" "}
                    {locationData.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Akurasi GPS: {Math.round(locationData.accuracy)} meter
                  </p>
                  {locationData.accuracy > MIN_GPS_ACCURACY && (
                    <p className="text-xs text-amber-700 font-bold mt-2">
                      Akurasi GPS rendah. Pindah ke area terbuka agar lokasi
                      lebih tepat.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={submitAttendance}
                disabled={!locationData || isSubmitting || isGettingLocation}
                className={
                  !locationData || isSubmitting || isGettingLocation
                    ? BTN_DISABLED
                    : BTN_PRIMARY
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim absensi
                  </>
                )}
              </button>

              {locationData && !isSubmitting && (
                <button
                  type="button"
                  onClick={retryLocation}
                  className={BTN_SECONDARY}
                >
                  <RefreshCw className="w-4 h-4" />
                  Ambil ulang lokasi
                </button>
              )}
              <button
                type="button"
                onClick={backToDashboard}
                disabled={isSubmitting}
                className={BTN_SECONDARY}
              >
                Batal
              </button>
            </div>
          </section>
        )}

        {/* ===================== RESULT ===================== */}
        {view === "result" && resultData?.success && (
          <section className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-neutral-900 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                {resultData.data?.checkOut
                  ? "Absen pulang berhasil"
                  : "Absen masuk berhasil"}
              </h2>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto mt-1">
                Kehadiranmu sudah tercatat di sistem Kerjaku.
              </p>
            </div>

            <div className={`${CARD} p-4 w-full text-left`}>
              <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500">Waktu</span>
                <span className="text-sm font-black text-neutral-900">
                  {resultData.data?.date ?? "-"}{" "}
                  {resultData.data?.checkOut ?? resultData.data?.checkIn ?? ""}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500">Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${statusBadgeClass(resultData.data?.status)}`}
                >
                  {formatStatusLabel(resultData.data?.status)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-neutral-500">Jarak</span>
                <span className="text-sm font-black text-neutral-900">
                  {resultData.data?.distance}m (batas{" "}
                  {resultData.data?.allowedRadius}m)
                </span>
              </div>
            </div>

            <Link href="/dashboard" className={`${BTN_PRIMARY} text-center`}>
              Kembali ke dashboard
            </Link>
            <button
              type="button"
              onClick={backToDashboard}
              className={BTN_SECONDARY}
            >
              Tutup
            </button>
          </section>
        )}

        {/* ===================== ERROR ===================== */}
        {view === "error" && (
          <section className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-2">
            <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-neutral-900 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Absensi gagal
              </h2>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed mt-1">
                {submitError || "Terjadi kesalahan saat mengirim absensi."}
              </p>
            </div>

            <div className="w-full space-y-2">
              {/* Gagal ambil lokasi -> ulangi lokasi */}
              {qrToken && !locationData && (
                <button
                  type="button"
                  onClick={retryLocation}
                  className={BTN_PRIMARY}
                >
                  <MapPin className="w-4 h-4" />
                  Ambil lokasi lagi
                </button>
              )}

              {/* Gagal kirim -> kirim ulang */}
              {qrToken && locationData && (
                <button
                  type="button"
                  onClick={retrySubmit}
                  disabled={isSubmitting}
                  className={isSubmitting ? BTN_DISABLED : BTN_PRIMARY}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim ulang…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Kirim ulang
                    </>
                  )}
                </button>
              )}

              {qrToken && locationData && !isSubmitting && (
                <button
                  type="button"
                  onClick={retryLocation}
                  className={BTN_SECONDARY}
                >
                  <MapPin className="w-4 h-4" />
                  Ambil ulang lokasi
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goScan}
                  className={`${BTN_SECONDARY} flex-1`}
                >
                  <ScanLine className="w-4 h-4" />
                  Scan ulang
                </button>
                <button
                  type="button"
                  onClick={backToDashboard}
                  className={`${BTN_SECONDARY} flex-1`}
                >
                  Batal
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </PlaceholderLayout>
  );
}
