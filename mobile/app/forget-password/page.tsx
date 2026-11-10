"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import { authService, ForgetPasswordResult } from "../../lib/services/authService";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setEmailError(null);

    const err = authService.validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setIsLoading(true);
    try {
      const res: ForgetPasswordResult = await authService.forgetPassword(email);
      if (!res.success) {
        setGeneralError(res.error || "Gagal mengirim permintaan reset password");
        setIsLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setGeneralError("Koneksi bermasalah, coba lagi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PlaceholderLayout
      title="Lupa Kata Sandi"
      subtitle="Masukkan email akun kamu untuk mengatur ulang kata sandi"
      badge="Reset Password"
    >
      {sent ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-neutral-900 flex items-center justify-center mx-auto text-emerald-800">
            <Mail className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-extrabold text-neutral-900">Permintaan Terkirim</h2>
          <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
            Jika email terdaftar, kami akan mengirimkan instruksi reset kata
            sandi ke kotak masuk kamu. Cek email kamu segera.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 px-4 rounded-full font-bold text-sm bg-neutral-900 text-white border-2 border-neutral-900 text-center active:scale-[0.98] transition-transform"
          >
            Kembali ke Masuk
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
            >
              Email Akun
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

          {generalError && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border-2 border-rose-600 rounded-2xl text-xs text-rose-800 text-center"
            >
              {generalError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-full font-black text-sm tracking-wide bg-neutral-900 text-white border-2 border-neutral-900 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#171717] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim…</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 stroke-[2.5]" />
                <span>Kirim Link Reset</span>
              </>
            )}
          </button>

          <div className="text-center mt-2">
            <Link
              href="/login"
              className="text-[11px] text-neutral-600 font-medium hover:text-neutral-900"
            >
              Sudah ingat kata sandi? Kembali ke Masuk
            </Link>
          </div>
        </form>
      )}
    </PlaceholderLayout>
  );
}
