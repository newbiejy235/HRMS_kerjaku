"use client";

import { useEffect, useState } from "react";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import { Banknote, FileText, Calendar, AlertTriangle } from "lucide-react";
import { dashboardService, ReimbursementItem } from "../../lib/services/dashboardService";

const formatRupiah = (amount: string | number) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-2 border-neutral-900",
  approved: "bg-emerald-100 text-emerald-800 border-2 border-neutral-900",
  rejected: "bg-rose-100 text-rose-900 border-2 border-neutral-900",
};

export default function ReimbursePage() {
  const [items, setItems] = useState<ReimbursementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [receiptPhoto, setReceiptPhoto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadReimbursements();
  }, []);

  const loadReimbursements = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await dashboardService.getReimbursements();
      setItems(data);
    } catch {
      setErrorMsg("Data reimbursement belum bisa dimuat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMsg(null);

    try {
      await dashboardService.createReimbursement({
        name,
        description: description || undefined,
        amount,
        receiptPhoto: receiptPhoto || undefined,
        expenseDate,
      });
      setSubmitMsg({ text: "Pengajuan reimbursement berhasil dibuat", type: "success" });
      setName("");
      setDescription("");
      setAmount("");
      setExpenseDate("");
      setReceiptPhoto("");
      await loadReimbursements();
    } catch (err: any) {
      setSubmitMsg({ text: err.message || "Pengajuan reimbursement gagal, coba lagi", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PlaceholderLayout title="Reimbursement" subtitle="Ajukan pengajuan penggantian biaya" badge="Reimburse">
        <div className="flex-1 flex flex-col justify-center items-center space-y-3 p-6">
          <div className="h-4 bg-neutral-200/60 rounded-full w-24 animate-pulse" />
          <div className="h-4 bg-neutral-200/60 rounded-full w-40 animate-pulse" />
        </div>
      </PlaceholderLayout>
    );
  }

  if (errorMsg && items.length === 0) {
    return (
      <PlaceholderLayout title="Reimbursement" subtitle="Ajukan pengajuan penggantian biaya" badge="Reimburse">
        <div className="flex-1 flex flex-col justify-center items-center space-y-3 text-center p-6">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-neutral-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5 text-neutral-600" />
          </div>
          <h2 className="text-base font-extrabold text-neutral-900">{errorMsg}</h2>
          <button
            type="button"
            onClick={loadReimbursements}
            className="py-2.5 px-5 rounded-full bg-neutral-900 text-white font-bold text-sm border-2 border-neutral-900 active:scale-[0.98]"
          >
            Coba lagi
          </button>
        </div>
      </PlaceholderLayout>
    );
  }

  return (
    <PlaceholderLayout title="Reimbursement" subtitle="Ajukan pengajuan penggantian biaya" badge="Reimburse">
      <div className="flex-1 flex flex-col space-y-4">
        {/* Ajukan Baru Form */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[2px_2px_0px_0px_#171717]">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-4">
            Ajukan Reimbursement Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="reimb-name"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
              >
                Nama Pengajuan
              </label>
              <input
                id="reimb-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Uang makan, transport, dll."
                className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reimb-desc"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
              >
                Keterangan
              </label>
              <textarea
                id="reimb-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat tentang pengeluaran"
                className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reimb-amount"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
              >
                Jumlah (Rupiah)
              </label>
              <input
                id="reimb-amount"
                type="number"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reimb-date"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
              >
                Tanggal Pengeluaran
              </label>
              <input
                id="reimb-date"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reimb-receipt"
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 pl-3"
              >
                Foto Bukti (URL)
              </label>
              <input
                id="reimb-receipt"
                type="text"
                value={receiptPhoto}
                onChange={(e) => setReceiptPhoto(e.target.value)}
                placeholder="Link foto bukti transaksi"
                className="w-full py-3 pl-4 pr-4 rounded-full bg-white text-neutral-900 font-medium text-base border-2 border-neutral-900 focus:ring-2 focus:ring-[#C25E2E]/30 focus:outline-none"
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
                  <Banknote className="w-4 h-4" />
                  <span>Ajukan Reimbursement</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Riwayat Pengajuan */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[2px_2px_0px_0px_#171717]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
              Riwayat Pengajuan
            </h3>
            {items.length === 0 && (
              <span className="text-[11px] text-neutral-500 font-medium">Belum ada pengajuan</span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-4 bg-[#FAF7F2] border border-neutral-300 rounded-2xl text-center text-xs text-neutral-600">
              Belum ada pengajuan reimbursement. Ajukan pengajuan pertama di atas.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border-2 border-neutral-900 bg-[#FAF7F2] flex items-center justify-between shadow-[2px_2px_0px_0px_#171717]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-neutral-600 truncate">
                      {item.description || "-"}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {new Date(item.expenseDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border-2 ${STATUS_BADGE[item.status] ?? STATUS_BADGE.pending}`}>
                      {item.status === "pending" ? "Menunggu" : item.status === "approved" ? "Disetujui" : "Ditolak"}
                    </span>
                    <span className="text-xs font-black text-neutral-900">{formatRupiah(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-[#F4EFE6] border-2 border-neutral-900 rounded-2xl text-[11px] text-neutral-700 leading-relaxed">
          <p className="font-bold text-neutral-900 mb-1">
            Reimbursement akan disetujui oleh HR atau Finance
          </p>
          Lampirkan foto bukti transaksi (berupa URL) agar pengajuan lebih
          cepat diproses. Status pengajuan akan diperbarui setelah HR
          meninjau.
        </div>
      </div>
    </PlaceholderLayout>
  );
}
