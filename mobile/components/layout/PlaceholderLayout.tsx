"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PlaceholderLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: string;
}

export function PlaceholderLayout({
  title,
  subtitle,
  children,
  badge,
}: PlaceholderLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    // If router history exists, go back, else fallback to /dashboard
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-neutral-900 flex flex-col justify-between max-w-md mx-auto relative px-4 safe-top safe-bottom">
      {/* Top Bar with Back Button */}
      <header className="pt-2 pb-4 flex items-center justify-between border-b-2 border-neutral-900/10">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali ke halaman sebelumnya"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-neutral-900 bg-white font-bold text-xs hover:bg-neutral-100 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-neutral-900 text-white">
            {badge}
          </span>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-4 flex flex-col">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col">{children}</div>
      </main>

      {/* Subtle Mobile Footer */}
      <footer className="py-2 text-center border-t-2 border-neutral-900/10">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">
          Kerjaku F&B • Sistem Karyawan
        </span>
      </footer>
    </div>
  );
}
