"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarOff,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Receipt,
  ScanLine,
  Send,
  User,
} from "lucide-react";
import {
  dashboardService,
  ShiftScheduleItem,
  getTodayWIB,
  normalizeShiftDate,
  formatShiftCategory,
  formatShiftTime,
} from "../../lib/services/dashboardService";

/* Sesuaikan route dengan folder halaman kamu */
const ROUTES = {
  absen: "/absen",
  profile: "/profil",
  slip: "/slip-gaji",
  stats: "/statistik",
};

const CARD =
  "bg-white border-2 border-neutral-900 rounded-3xl shadow-[2px_2px_0px_0px_#171717]";
const BTN_BASE =
  "w-full inline-flex items-center justify-center gap-2 rounded-full border-2 font-bold text-sm transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2";
const BTN_PRIMARY = `${BTN_BASE} py-4 px-6 bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800`;
const BTN_SECONDARY = `${BTN_BASE} py-3 px-4 bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900`;

const POLL_INTERVAL_MS = 3000;
const DEFAULT_PAIRING_TTL_MS = 10 * 60 * 1000;

const formatDateLabel = (date: string, withYear = true): string =>
  new Date(`${date}T00:00:00+07:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Jakarta",
  });

type TelegramState = "checking" | "connected" | "idle" | "waiting";

export default function DashboardPage() {
  /* ---------------- Shift ---------------- */
  const [shifts, setShifts] = useState<ShiftScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setShifts(await dashboardService.getShiftSchedule());
    } catch (err: any) {
      setError(err?.message || "Gagal memuat jadwal shift");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  /* ---------------- Telegram ---------------- */
  const [tgState, setTgState] = useState<TelegramState>("checking");
  const [tgUrl, setTgUrl] = useState<string | null>(null);
  const [tgError, setTgError] = useState<string | null>(null);
  const [tgBusy, setTgBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    dashboardService
      .getTelegramStatus()
      .then((res) => {
        if (!cancelled) setTgState(res.connected ? "connected" : "idle");
      })
      .catch(() => {
        if (!cancelled) setTgState("idle");
      });
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [stopPolling]);

  const connectTelegram = async () => {
    setTgBusy(true);
    setTgError(null);
    try {
      const res = await dashboardService.createTelegramPairing();
      if (res.connected) {
        setTgState("connected");
        return;
      }
      if (!res.telegramUrl) {
        throw new Error(res.message || "Link Telegram tidak tersedia");
      }

      setTgUrl(res.telegramUrl);
      setTgState("waiting");

      // Cek status berkala sampai terhubung atau pairing kedaluwarsa
      const expiresAt = res.expiresAt
        ? new Date(res.expiresAt).getTime()
        : Date.now() + DEFAULT_PAIRING_TTL_MS;

      stopPolling();
      pollRef.current = setInterval(async () => {
        if (Date.now() > expiresAt) {
          stopPolling();
          setTgState("idle");
          setTgUrl(null);
          setTgError("Link kedaluwarsa. Coba hubungkan lagi.");
          return;
        }
        try {
          const status = await dashboardService.getTelegramStatus();
          if (status.connected) {
            stopPolling();
            setTgState("connected");
            setTgUrl(null);
          }
        } catch {
          // abaikan, coba lagi di interval berikutnya
        }
      }, POLL_INTERVAL_MS);
    } catch (err: any) {
      setTgError(err?.message || "Gagal membuat link Telegram");
    } finally {
      setTgBusy(false);
    }
  };

  /* ---------------- Turunan data shift ---------------- */
  const today = getTodayWIB();
  const sortedShifts = [...shifts]
    .map((shift) => ({
      ...shift,
      shiftDate: normalizeShiftDate(shift.shiftDate),
      upcomingShiftDate: shift.upcomingShiftDate
        ? normalizeShiftDate(shift.upcomingShiftDate)
        : null,
    }))
    .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        <header>
          <h1 className="text-xl font-black text-neutral-900">Dashboard</h1>
          <p className="text-xs text-neutral-600">Jadwal shift dan menu kamu</p>
        </header>

        {/* ---------- Loading ---------- */}
        {isLoading && (
          <div className={`${CARD} p-5 animate-pulse`} aria-busy="true">
            <div className="h-3 w-24 bg-neutral-200 rounded mb-3" />
            <div className="h-7 w-40 bg-neutral-200 rounded mb-4" />
            <div className="h-12 bg-neutral-100 rounded-2xl" />
          </div>
        )}

        {/* ---------- Error ---------- */}
        {!isLoading && error && (
          <div className={`${CARD} p-5 text-center space-y-3`}>
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 border-2 border-neutral-900 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-neutral-900">
              Jadwal tidak bisa dimuat
            </p>
            <p className="text-xs text-neutral-600">{error}</p>
            <button
              type="button"
              onClick={loadShifts}
              className={BTN_SECONDARY}
            >
              <RefreshCw className="w-4 h-4" />
              Coba lagi
            </button>
          </div>
        )}

        {/* ---------- Shift hari ini ---------- */}
        {!isLoading && !error && (
          <>
            <section className={`${CARD} p-5`}>
              <p className="text-xs font-semibold text-neutral-500">
                Shift hari ini
              </p>
              <p className="text-sm font-bold text-neutral-900 mb-4">
                {formatDateLabel(today)}
              </p>

              {sortedShifts.length === 0 ? (
                /* State: Kosong / Tidak Ada Data Shift Sama Sekali */
                <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-neutral-50 border border-dashed border-neutral-300 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                    <CalendarOff className="w-6 h-6 text-amber-600 shrink-0" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Belum Ada Jadwal Shift
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">
                    Belum ada data shift yang terdaftar di sistem untuk akun
                    Anda.
                  </p>
                </div>
              ) : (
                /* State: Tampilkan Semua Shift Terbaru */
                <div className="space-y-3">
                  {sortedShifts.map((shift) => (
                    <div
                      key={shift.shiftId}
                      className="group relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-white to-[#FAF7F2] border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Aksen garis vertikal di kiri */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-neutral-900 rounded-l-full" />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-block px-2.5 py-1 mb-2 text-[10px] font-bold tracking-wider uppercase bg-neutral-900 text-white rounded-full">
                            {shift.shiftDate}
                          </span>
                          <h4 className="text-xl font-extrabold tracking-tight text-neutral-900">
                            {formatShiftCategory(shift.category)}
                          </h4>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-200/60 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                        <div className="inline-flex items-center gap-2 font-mono font-bold tabular-nums bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-2xs">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-900">
                            {formatShiftTime(shift.shiftDate)} -{" "}
                            {formatShiftTime(shift.normal_time_in)}
                          </span>
                        </div>

                        {shift.employeeLocate && (
                          <div className="inline-flex items-center gap-1.5 font-medium text-neutral-700">
                            <MapPin className="w-4 h-4 text-neutral-400" />
                            <span>{shift.employeeLocate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ---------- Tombol absensi ---------- */}
            <div className="space-y-2">
              <Link href={ROUTES.absen} className={BTN_PRIMARY}>
                <ScanLine className="w-4 h-4" />
                Absen sekarang
              </Link>
              <p className="text-xs text-center text-neutral-500">
                Siapkan QR Code outlet dan aktifkan GPS sebelum absen.
              </p>
            </div>

            {/* ---------- Jadwal berikutnya ---------- */}
          </>
        )}

        {/* ---------- Navigasi ---------- */}
        <nav aria-label="Menu" className="grid grid-cols-2 gap-3">
          {[
            { href: ROUTES.profile, label: "Profil", Icon: User },
            { href: ROUTES.slip, label: "Slip gaji", Icon: Receipt },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 py-4 rounded-3xl bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#171717] text-neutral-900 transition-transform active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-bold">{label}</span>
            </Link>
          ))}
        </nav>

        {/* ---------- Telegram ---------- */}
        <section className={`${CARD} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-neutral-900">
                Notifikasi Telegram
              </h2>
              <p className="text-xs text-neutral-600">
                {tgState === "connected"
                  ? "Akun Telegram kamu sudah terhubung."
                  : "Hubungkan untuk menerima pengingat dan info shift."}
              </p>
            </div>
            {tgState === "connected" && (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
          </div>

          {tgState === "checking" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memeriksa status…
            </div>
          )}

          {tgState === "idle" && (
            <div className="mt-4">
              <button
                type="button"
                onClick={connectTelegram}
                disabled={tgBusy}
                className={`${BTN_BASE} py-3.5 px-4 ${
                  tgBusy
                    ? "bg-neutral-300 text-neutral-500 border-neutral-300 cursor-not-allowed"
                    : "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800"
                }`}
              >
                {tgBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Membuat link…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Hubungkan Telegram
                  </>
                )}
              </button>
            </div>
          )}

          {tgState === "waiting" && tgUrl && (
            <div className="mt-4 space-y-2">
              <a
                href={tgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${BTN_BASE} py-3.5 px-4 bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800`}
              >
                <ExternalLink className="w-4 h-4" />
                Buka Telegram
              </a>
              <p className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Tekan Start di bot, kami menunggu koneksi…
              </p>
            </div>
          )}

          {tgError && (
            <p className="mt-3 text-xs font-medium text-rose-700">{tgError}</p>
          )}
        </section>
      </div>
    </main>
  );
}
