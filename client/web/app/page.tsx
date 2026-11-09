
"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    let destination = "/login";

    if (token && role === "HR") {
      destination = "/hr/dashboard";
    } else if (token && role === "Finance") {
      destination = "/finance/dashboard";
    }

    window.location.replace(destination);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] text-white">

      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7cff9b]/10 blur-[120px]" />

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Spinner */}
        <div className="relative flex h-20 w-20 items-center justify-center">

          {/* Outer Ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/10 border-t-[#7cff9b]" />

          {/* Inner Ring */}
          <div className="absolute inset-3 animate-spin rounded-full border-2 border-white/5 border-b-[#7cff9b]/60 [animation-direction:reverse] [animation-duration:1.5s]" />

          {/* Center Pulse */}
          <div className="h-3 w-3 animate-pulse rounded-full bg-[#7cff9b] shadow-[0_0_20px_#7cff9b]" />

        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <h1 className="text-xl font-bold tracking-[0.3em]">
            KERJAKU
          </h1>

          <p className="mt-2 text-xs tracking-widest text-zinc-500">
            HUMAN RESOURCE MANAGEMENT
          </p>
        </div>

        {/* Loading Text */}
        <div className="mt-8 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7cff9b]" />

          <p className="text-xs font-medium tracking-wider text-zinc-400">
            Loading...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-[#7cff9b]" />
        </div>

          <p className="text-xs mt-4 font-medium tracking-wider text-zinc-400">Note : lakukaan refresh jika loading lama</p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[10px] tracking-widest text-zinc-600">
        KERJAKU HRMS © 2026
      </div>

      {/* Custom Animation */}
      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>

    </main>
  );
}
