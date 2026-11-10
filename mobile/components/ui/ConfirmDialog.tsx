"use client";

import React, { useEffect } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity"
    >
      <div className="w-full max-w-xs sm:max-w-sm bg-[#FAF7F2] border-2 border-neutral-900 rounded-3xl p-6 shadow-2xl text-center transform transition-transform animate-in fade-in zoom-in-95 duration-150">
        <h3
          id="dialog-title"
          className="text-lg font-extrabold text-neutral-900 mb-2"
        >
          {title}
        </h3>
        <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full py-3 px-4 rounded-full font-bold text-sm border-2 border-neutral-900 transition-transform active:scale-[0.98] ${
              isDestructive
                ? "bg-neutral-900 text-white hover:bg-neutral-800"
                : "bg-neutral-900 text-white"
            }`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 px-4 rounded-full font-semibold text-sm bg-white text-neutral-900 border-2 border-neutral-900 hover:bg-neutral-100 transition-transform active:scale-[0.98]"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
