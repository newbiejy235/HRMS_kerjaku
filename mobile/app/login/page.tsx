"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Coffee, ArrowRight, Loader2 } from "lucide-react";
import { authService } from "../../lib/services/authService";
import { isAuthenticated, isEmployee } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Route guard: if already logged in as Karyawan, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated() && isEmployee()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError(null);
    const errEmail = authService.validateEmail(email);
    const errPassword = authService.validatePassword(password);

    setEmailError(errEmail);
    setPasswordError(errPassword);

    if (errEmail || errPassword) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login(email, password);
      if (!res.success) {
        setGeneralError(res.error || "Email atau password salah, coba cek lagi");
        setIsLoading(false);
        return;
      }

      router.replace("/dashboard");
    } catch {
      setGeneralError("Koneksi bermasalah, coba lagi");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-neutral-900 flex flex-col justify-between px-6 safe-top safe-bottom max-w-md mx-auto">
      {/* Top Header / Brand */}
      <header className="pt-6 sm:pt-10 flex flex-col items-center text-center">
        {/* Simple ink line-art icon */}
        <div className="w-14 h-14 rounded-2xl border-2 border-neutral-900 bg-white flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_#171717]">
          <Coffee className="w-7 h-7 text-neutral-900 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
          Kerjaku
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-1">
          Masuk ke akun kerjamu
        </p>
      </header>

      {/* Center Form Section (Reference Gambar 2 Auth) */}
      <main className="my-auto py-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* General Error Banner */}
          {generalError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border-2 border-rose-600 rounded-2xl text-xs sm:text-sm font-semibold text-rose-800 text-center animate-in fade-in duration-150"
            >
              {generalError}
            </div>
          )}

          {/* Email Pill Input */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-neutral-700 pl-3"
            >
              Email Karyawan
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-neutral-500 pointer-events-none">
                <Mail className="w-5 h-5 stroke-[2]" />
              </span>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                disabled={isLoading}
                placeholder="nama@kerjaku.com"
                className={`w-full py-3.5 pl-12 pr-4 rounded-full bg-white text-neutral-900 placeholder-neutral-400 font-medium text-base border-2 transition-all ${
                  emailError
                    ? "border-rose-600 bg-rose-50/40"
                    : "border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
                }`}
              />
            </div>
            {emailError && (
              <p className="text-xs text-rose-600 font-semibold pl-4 pt-0.5">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Pill Input with Toggle */}
          <div className="space-y-1 pt-1">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-neutral-700 pl-3"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-neutral-500 pointer-events-none">
                <Lock className="w-5 h-5 stroke-[2]" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                disabled={isLoading}
                placeholder="Masukkan kata sandi"
                className={`w-full py-3.5 pl-12 pr-12 rounded-full bg-white text-neutral-900 placeholder-neutral-400 font-medium text-base border-2 transition-all ${
                  passwordError
                    ? "border-rose-600 bg-rose-50/40"
                    : "border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                className="absolute right-4 text-neutral-500 hover:text-neutral-900 p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 stroke-[2]" />
                ) : (
                  <Eye className="w-5 h-5 stroke-[2]" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-rose-600 font-semibold pl-4 pt-0.5">
                {passwordError}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-center pt-1">
            <p className="text-xs text-neutral-500">
              Lupa kata sandi?{" "}
              <Link
                href="/forget-password"
                className="font-bold text-neutral-900 hover:underline"
              >
                Atur ulang di sini
              </Link>
            </p>
          </div>

          {/* Main Action Pill Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-full font-black text-sm tracking-wide bg-neutral-900 text-white border-2 border-neutral-900 flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>

          {/* Demo account hint for quick testing */}
        </form>
      </main>

      {/* Footer Support Info */}
      <footer className="pb-6 text-center">
        <p className="text-xs text-neutral-600">
          Belum punya akun?{" "}
          <span className="font-bold text-neutral-900">
            Hubungi HR kamu
          </span>
        </p>
      </footer>
    </div>
  );
}
