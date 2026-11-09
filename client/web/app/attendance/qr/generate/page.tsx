"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  QrCode,
  Clock,
  RefreshCw,
  Maximize2,
  Minimize2,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Building2,
  LogOut,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QrData = {
  qrCode: string;
  token: string;
  expiresAt: string;
};

export default function AttendanceQrKioskPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hrEmail, setHrEmail] = useState<string>("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // QR state
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrError, setQrError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [totalDuration, setTotalDuration] = useState<number>(60);
  const [generationCount, setGenerationCount] = useState<number>(0);

  // Kiosk UI state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Live clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Check initial authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email") || "Akun HR";

    if (token && role === "HR") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      setHrEmail(email);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Play subtle sound beep when refreshed
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, [soundEnabled]);

  // Generate QR Code from backend
  const fetchNewQr = useCallback(async () => {
    setIsGenerating(true);
    setQrError("");

    try {
      const response = await apiFetch("/attendance/qr/generate", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          setIsAuthenticated(false);
          setLoginError(result.message || "Sesi HR berakhir, silakan login kembali.");
          return;
        }
        throw new Error(result.message || "Gagal membuat QR Code baru");
      }

      const data: QrData = result.data;
      setQrData(data);
      setGenerationCount((c) => c + 1);

      // Calculate lifetime from expiresAt
      const expires = new Date(data.expiresAt).getTime();
      const now = Date.now();
      const diffSecs = Math.max(5, Math.round((expires - now) / 1000));
      setSecondsLeft(diffSecs);
      setTotalDuration(diffSecs);

      playChime();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      console.error("Error generating QR:", message);
      setQrError(message);
      // If error occurs, retry after 5 seconds
      setSecondsLeft(5);
      setTotalDuration(5);
    } finally {
      setIsGenerating(false);
    }
  }, [playChime]);

  // Start generation once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNewQr();
    }
  }, [isAuthenticated, fetchNewQr]);

  // Countdown timer loop & automatic renewal on expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Time expired! Auto-generate new QR
          fetchNewQr();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, fetchNewQr]);

  // Handle HR Login directly on kiosk
  const handleKioskLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.userData) {
        throw new Error(data.message || "Email atau kata sandi salah");
      }

      if (data.userData.role !== "HR") {
        throw new Error("Hanya akun dengan peran HR yang dapat mengaktifkan Kiosk QR Absensi.");
      }

      localStorage.setItem("token", data.userData.token);
      localStorage.setItem("role", data.userData.role);
      localStorage.setItem("email", data.userData.email);

      setHrEmail(data.userData.email);
      setIsAuthenticated(true);
      setLoginPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal masuk";
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleKioskLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari mode Kiosk QR Absensi?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      setIsAuthenticated(false);
      setQrData(null);
    }
  };

  // Format Indonesian Date & Time
  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(currentTime);

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / (totalDuration || 60)) * 100));

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ==========================================
  // VIEW 1: HR LOGIN SCREEN (For Tablet Kiosk)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4 sm:p-6 overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-6 text-white">
            {/* Header / Logo */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2 shadow-inner">
                <QrCode className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight font-heading">
                Kiosk QR Absensi
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Masuk dengan akun HR untuk mengaktifkan generator QR Code absensi otomatis pada perangkat tablet ini.
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleKioskLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Akun HR
                </Label>
                <Input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="hr@kerjaku.com"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Kata Sandi
                </Label>
                <Input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 h-11 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-900/40 text-sm mt-2"
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memverifikasi Akun...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mulai Sesi Kiosk Absensi
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Login Standar
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE KIOSK DISPLAY (Auto Regenerating QR)
  // ==========================================
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP BAR: Brand & Kiosk Controls */}
      <header className="relative z-10 w-full px-6 py-4 sm:px-10 sm:py-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/30 font-heading">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white font-heading">
                KerjaKu<span className="text-emerald-400">.</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Tablet Kiosk Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">Terminal Absensi Karyawan</p>
          </div>
        </div>

        {/* Live Date & Clock Display */}
        <div className="hidden md:flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-emerald-400 drop-shadow-sm">
            {formattedTime}
          </div>
          <div className="text-xs text-slate-400 capitalize">{formattedDate}</div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Nonaktifkan Nada" : "Aktifkan Nada Pembaruan"}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (Tablet Kiosk)"}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Dashboard Link */}
          <Link
            href="/hr/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            Dashboard HR
          </Link>

          {/* Logout / Exit Kiosk */}
          <button
            onClick={handleKioskLogout}
            title="Keluar dari Kiosk"
            className="p-2.5 rounded-xl border border-rose-900/30 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT: THE QR CARD */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl flex flex-col items-center">
          {/* Mobile Clock view */}
          <div className="md:hidden flex flex-col items-center mb-4">
            <div className="text-3xl font-mono font-bold tracking-widest text-emerald-400">
              {formattedTime}
            </div>
            <div className="text-xs text-slate-400 capitalize">{formattedDate}</div>
          </div>

          {/* Outer Card */}
          <div className="w-full bg-slate-900/95 border border-slate-800/90 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center backdrop-blur-xl relative overflow-hidden">
            {/* Top Badge: Auto-Refresh Status */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs text-slate-400 mb-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-slate-200">
                  {isGenerating ? "Memperbarui QR Code..." : "Sesi QR Absensi Aktif"}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Dioperasikan oleh:</span>
                <span className="font-semibold text-slate-300 truncate max-w-[140px]">{hrEmail}</span>
              </div>
            </div>

            {/* Error Banner */}
            {qrError && (
              <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{qrError}. Mencoba ulang otomatis...</span>
                </div>
                <button
                  onClick={fetchNewQr}
                  className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/40 rounded text-rose-200 text-[11px] font-semibold"
                >
                  Coba Sekarang
                </button>
              </div>
            )}

            {/* QR CODE CONTAINER */}
            <div className="relative group my-2">
              <div className="relative bg-white p-4 sm:p-6 rounded-3xl shadow-xl flex items-center justify-center border-4 border-emerald-500/40 transition-all duration-300">
                {qrData?.qrCode ? (
                  <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                    <Image
                      src={qrData.qrCode}
                      alt="QR Code Absensi"
                      width={320}
                      height={320}
                      priority
                      className={`w-full h-full object-contain rounded-xl transition-opacity duration-300 ${
                        isGenerating ? "opacity-30 blur-[1px]" : "opacity-100"
                      }`}
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 rounded-xl gap-2">
                        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-800 tracking-wide">
                          Membuat QR Baru...
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-64 h-64 sm:w-80 sm:h-80 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="text-xs text-slate-500">Memuat QR Code...</p>
                  </div>
                )}
              </div>
            </div>

            {/* COUNTDOWN & PROGRESS BAR */}
            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kedaluwarsa dalam:</span>
                </div>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {secondsLeft}s
                </div>
              </div>

              {/* Linear Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    secondsLeft <= 10
                      ? "bg-rose-500"
                      : secondsLeft <= 25
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>QR otomatis di-generate ulang setelah expired</span>
                <span>Diperbarui {generationCount} kali</span>
              </div>
            </div>

            {/* MANUAL REGENERATE & INSTRUCTION FOOTER */}
            <div className="w-full mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left space-y-0.5">
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Instruksi Absensi Karyawan
                </p>
                <p className="text-[11px] text-slate-400">
                  Scan QR di atas menggunakan aplikasi KerjaKu Karyawan di ponsel Anda.
                </p>
              </div>

              <Button
                onClick={fetchNewQr}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="shrink-0 h-9 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs rounded-xl"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} />
                Perbarui Sekarang
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-3 px-6 text-center text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950/80">
        KerjaKu Kiosk Terminal • Sistem Absensi Terintegrasi & Aman • Token diperbarui berkala
      </footer>
    </div>
  );
}
