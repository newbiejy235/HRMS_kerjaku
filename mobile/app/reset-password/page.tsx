"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import { authService, ResetPasswordResult } from "../../lib/services/authService";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setGeneralError("Token reset tidak valid. Mohon minta link reset baru.");
    }
  }, [token]);

  const validate = () => {
    setPasswordError(null);
    setConfirmError(null);
    const errPassword = authService.validatePassword(password);
    if (errPassword) {
      setPasswordError(errPassword);
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmError("Konfirmasi kata sandi tidak cocok");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res: ResetPasswordResult = await authService.resetPassword(token, password);
      if (!res.success) {
        setGeneralError(res.error || "Gagal mengubah kata sandi");
        setIsLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setGeneralError("Koneksi bermasalah, coba lagi");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <PlaceholderLayout
        title="Kata Sandi Berhasil Diubah"
        subtitle="Kata sandi akun kamu telah diperbarui"
        badge="Reset Password"
      >
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-neutral-900 flex items-center justify-center mx-auto text-emerald-800">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-extrabold text-neutral-900">Selamat!</h2>
          <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
            Kata sandi kamu telah berhasil diubah. Silakan masuk dengan kata
            sandi baru.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 px-4 rounded-full font-bold text-sm bg-neutral-900 text-white border-2 border-neutral-900 text-center active:scale-[0.98] transition-transform"
          >
            Masuk Sekarang
          </Link>
        </div>
      </PlaceholderLayout>
    );
  }

  return (
    <PlaceholderLayout
      title="Ubah Kata Sandi"
      subtitle="Masukkan kata sandi baru untuk akun kamu"
      badge="Reset Password"
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
          >
            Kata Sandi Baru
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-neutral-500 pointer-events-none">
              <Lock className="w-5 h-5 stroke-[2]" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              disabled={isLoading}
              placeholder="Minimal 6 karakter"
              className={`w-full py-3.5 pl-12 pr-12 rounded-full bg-white text-neutral-900 placeholder-neutral-400 font-medium text-base border-2 transition-all ${
                passwordError
                  ? "border-rose-600 bg-rose-50/40"
                  : "border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              className="absolute right-4 text-neutral-500 hover:text-neutral-900 p-1"
            >
              {showPassword ? (
                <Lock className="w-5 h-5 stroke-[2]" />
              ) : (
                <Lock className="w-5 h-5 stroke-[2]" />
              )}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-rose-600 font-semibold pl-4 pt-0.5">
              {passwordError}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirm-password"
            className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
          >
            Konfirmasi Kata Sandi
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-neutral-500 pointer-events-none">
              <Lock className="w-5 h-5 stroke-[2]" />
            </span>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError(null);
              }}
              disabled={isLoading}
              placeholder="Masukkan kembali kata sandi"
              className={`w-full py-3.5 pl-12 pr-12 rounded-full bg-white text-neutral-900 placeholder-neutral-400 font-medium text-base border-2 transition-all ${
                confirmError
                  ? "border-rose-600 bg-rose-50/40"
                  : "border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
              }`}
            />
          </div>
          {confirmError && (
            <p className="text-xs text-rose-600 font-semibold pl-4 pt-0.5">
              {confirmError}
            </p>
          )}
        </div>

        {generalError && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border-2 border-rose-600 rounded-2xl text-xs text-rose-800 text-center"
          >
            {generalError}
          </div>
        )}

        {!token && (
          <div className="p-3 bg-rose-50 border-2 border-rose-600 rounded-2xl text-xs text-rose-800 text-center">
            Token reset tidak tersedia. Silakan minta link reset melalui halaman Lupa Kata Sandi.
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !token}
          className="w-full py-4 px-6 rounded-full font-black text-sm tracking-wide bg-neutral-900 text-white border-2 border-neutral-900 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#171717] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengubah…</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Kata Sandi Baru</span>
            </>
          )}
        </button>

        <div className="text-center mt-2">
          <Link
            href="/login"
            className="text-[11px] text-neutral-600 font-medium hover:text-neutral-900"
          >
            Kembali ke Masuk
          </Link>
        </div>
      </form>
    </PlaceholderLayout>
  );
}
