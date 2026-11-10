"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Check, X, Sparkles } from "lucide-react";

interface CoachMarkProps {
  onFinish?: () => void;
}

const STEPS = [
  {
    step: 1,
    title: "1. Pantau Kehadiranmu",
    description:
      "Lihat ringkasan hadir, telat, lembur, dan shift kerjamu hari ini secara langsung tanpa perlu bertanya ke HR.",
  },
  {
    step: 2,
    title: "2. Absen Cepat Sekali Sentuh",
    description:
      "Tinggal tekan tombol 'Absen Sekarang' saat tiba di outlet. Pastikan GPS aktif dan siapkan scan QR outlet.",
  },
  {
    step: 3,
    title: "3. Akses Menu Penting di Bawah",
    description:
      "Buka info Profil, rincian Slip Gaji bulanan, serta jadwal Shift mendatang lewat 3 tombol bulat di bagian bawah.",
  },
];

export function CoachMark({ onFinish }: CoachMarkProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("kerjaku_coach_seen");
    if (!hasSeen) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("kerjaku_coach_seen", "true");
    setVisible(false);
    onFinish?.();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[currentStep];

  return (
    <div
      role="dialog"
      aria-label="Petunjuk Penggunaan"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xs sm:max-w-sm bg-[#FAF7F2] border-2 border-neutral-900 rounded-3xl p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-xs font-bold text-neutral-500 hover:text-neutral-900 px-2 py-1"
        >
          Lewati
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
            {current.step}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Panduan Cepat ({current.step} dari {STEPS.length})
          </span>
        </div>

        <h3 className="text-base font-extrabold text-neutral-900 mb-2 leading-tight">
          {current.title}
        </h3>

        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed mb-6">
          {current.description}
        </p>

        {/* Step dots */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, idx) => (
              <span
                key={s.step}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? "w-6 bg-neutral-900"
                    : "w-2 bg-neutral-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full font-bold text-xs bg-neutral-900 text-white border-2 border-neutral-900 active:scale-95 transition-transform"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                Mulai Kerja <Check className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Lanjut <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
