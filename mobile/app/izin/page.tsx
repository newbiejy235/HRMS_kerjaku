"use client";

import { useState } from "react";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import {
  Calendar,
  Clock,
  AlertCircle,
  Banknote,
  FileText,
} from "lucide-react";
import { dashboardService } from "../../lib/services/dashboardService";

type RequestType = "izin" | "lembur" | "cuti";

const TYPE_LABEL: Record<RequestType, { label: string; icon: React.ReactNode }> = {
  izin: { label: "Izin", icon: <Calendar className="w-5 h-5" /> },
  lembur: { label: "Lembur", icon: <Clock className="w-5 h-5" /> },
  cuti: { label: "Cuti", icon: <AlertCircle className="w-5 h-5" /> },
};

export default function IzinPage() {
  const [activeType, setActiveType] = useState<RequestType>("izin");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [overtimeDate, setOvertimeDate] = useState("");
  const [overtimeTotal, setOvertimeTotal] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMsg(null);

    try {
      if (activeType === "lembur") {
        await dashboardService.requestOvertime({
          overtimeDate,
          overtimeTotal: parseInt(overtimeTotal, 10) || 0,
          description,
        });
      } else {
        await dashboardService.requestPermission({
          start_date: startDate,
          end_date: endDate,
          permit_type: activeType === "cuti" ? "holiday" : "permission",
          permit_reason: description,
        });
      }
      setSubmitMsg({
        text: activeType === "lembur" ? "Pengajuan lembur berhasil dibuat" : "Pengajuan izin/cuti berhasil dibuat",
        type: "success",
      });
    } catch (err: any) {
      setSubmitMsg({
        text: err.message || "Pengajuan gagal dibuat, coba lagi",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PlaceholderLayout
      title="Pengajuan Izin, Lembur & Cuti"
      subtitle="Ajukan izin kerja, lembur, atau cuti ke HR"
      badge="Pengajuan"
    >
      <div className="flex-1 flex flex-col space-y-4">
        {/* Jenis Pengajuan Tabs */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-3 shadow-[2px_2px_0px_0px_#171717]">
          <div className="flex gap-1">
            {(["izin", "lembur", "cuti"] as RequestType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${
                  activeType === type
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-[#FAF7F2] text-neutral-700 border-neutral-300"
                }`}
              >
                {TYPE_LABEL[type].icon}
                <span className="ml-2">{TYPE_LABEL[type].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[2px_2px_0px_0px_#171717]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-4">
              Isi Detail Pengajuan
            </h3>

            {activeType !== "lembur" && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="start-date"
                    className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
                  >
                    Tanggal Mulai
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="end-date"
                    className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
                  >
                    Tanggal Selesai
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
                  />
                </div>
              </>
            )}

            {activeType === "lembur" && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="ot-date"
                    className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
                  >
                    Tanggal Lembur
                  </label>
                  <input
                    id="ot-date"
                    type="date"
                    required
                    value={overtimeDate}
                    onChange={(e) => setOvertimeDate(e.target.value)}
                    className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="ot-total"
                    className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
                  >
                    Durasi Lembur (Jam)
                  </label>
                  <input
                    id="ot-total"
                    type="number"
                    min="1"
                    required
                    value={overtimeTotal}
                    onChange={(e) => setOvertimeTotal(e.target.value)}
                    className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="reason"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
              >
                Alasan / Keterangan
              </label>
              <textarea
                id="reason"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Keperluan keluarga, behandel, dll."
                className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none resize-none"
              />
            </div>

            {submitMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold text-center ${
                  submitMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-600"
                    : "bg-rose-50 text-rose-800 border-2 border-rose-600"
                }`}
              >
                {submitMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-full font-black text-sm tracking-wide border-2 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                isSubmitting
                  ? "bg-neutral-400 text-neutral-100 border-neutral-400 cursor-not-allowed"
                  : "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white rounded-full border-t-transparent mr-2"></span>
                  Mengirim…
                </>
              ) : (
                <>
                  {activeType === "lembur" ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Ajukan Lembur</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Ajukan {activeType === "cuti" ? "Cuti" : "Izin"}</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-[#F4EFE6] border-2 border-neutral-900 rounded-2xl text-[11px] text-neutral-700 leading-relaxed">
            <p className="font-bold text-neutral-900 mb-1">
              Pengajuan akan ditinjau oleh HR outlet
            </p>
            Status pengajuan (Menunggu / Disetujui / Ditolak) bisa dilihat di
            halaman Dashboard dalam strip notifikasi. Notifikasi juga akan
            dikirim ke Telegram jika sudah terhubung.
          </div>
        </form>
      </div>
    </PlaceholderLayout>
  );
}
