"use client";

import React, { useEffect } from "react";
import { X, Bell, CalendarClock, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export interface DetailItem {
  title: string;
  category: "jadwal" | "pengajuan";
  status: "Menunggu" | "Disetujui" | "Ditolak" | "Info";
  date: string;
  description: string;
}

interface DetailSheetProps {
  item: DetailItem | null;
  onClose: () => void;
}

export function DetailSheet({ item, onClose }: DetailSheetProps) {
  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  if (!item) return null;

  const getStatusBadge = (status: DetailItem["status"]) => {
    switch (status) {
      case "Disetujui":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border-2 border-neutral-900">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case "Ditolak":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border-2 border-neutral-900">
            <AlertCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case "Menunggu":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border-2 border-neutral-900">
            <Clock className="w-3.5 h-3.5" /> Menunggu Persetujuan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF7F2] text-neutral-800 border-2 border-neutral-900">
            <Bell className="w-3.5 h-3.5" /> Pembaruan Info
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF7F2] border-t-2 sm:border-2 border-neutral-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-white flex items-center justify-center">
              {item.category === "jadwal" ? (
                <CalendarClock className="w-4 h-4 text-neutral-900" />
              ) : (
                <FileText className="w-4 h-4 text-neutral-900" />
              )}
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-600">
              {item.category === "jadwal" ? "Perubahan Jadwal" : "Status Pengajuan"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-white flex items-center justify-center hover:bg-neutral-100 active:scale-95"
          >
            <X className="w-4 h-4 text-neutral-900" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-500 font-medium">{item.date}</span>
            {getStatusBadge(item.status)}
          </div>
          <h4 className="text-base font-extrabold text-neutral-900 leading-snug">
            {item.title}
          </h4>
        </div>

        <div className="p-4 bg-white border-2 border-neutral-900 rounded-2xl mb-6">
          <p className="text-sm text-neutral-700 leading-relaxed">
            {item.description}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-full font-bold text-sm bg-neutral-900 text-white border-2 border-neutral-900 active:scale-[0.98]"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
