"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

type Payroll = {
  payrollId: number;
  employeeId: string;
  employeeName: string;
  payrollPeriod: string;
  totalEarnings: string;
  totalDeductions: string;
  netSalary: string;
  status: string;
  reviewerEmail: string | null;
};

const formatRupiah = (angka: string | number) => {
  const num = typeof angka === "string" ? parseFloat(angka) : angka;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);
};

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        const response = await apiFetch("/finance/payrolls");
        const result = await response.json();

        if (result.success) {
          setPayrolls(result.data);
        } else {
          setErrorMsg(result.message || "Gagal mengambil data penggajian.");
        }
      } catch (error) {
        setErrorMsg("Tidak dapat terhubung ke server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayrolls();
  }, []);

  const totalPengeluaran = payrolls.reduce(
    (acc, curr) => acc + parseFloat(curr.netSalary || "0"),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
          Penggajian
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar riwayat dan status penggajian karyawan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Pengeluaran Gaji</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {formatRupiah(totalPengeluaran)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Karyawan Digaji</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {payrolls.length} Karyawan
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Periode Terakhir</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {payrolls.length > 0 ? payrolls[0].payrollPeriod : "-"}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nama Karyawan</th>
                <th className="px-6 py-3 font-medium">Periode</th>
                <th className="px-6 py-3 font-medium text-right">Pendapatan</th>
                <th className="px-6 py-3 font-medium text-right">Potongan</th>
                <th className="px-6 py-3 font-medium text-right">Gaji Bersih</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-600">
                    {errorMsg}
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data penggajian.
                  </td>
                </tr>
              ) : (
                payrolls.map((row) => (
                  <tr key={row.payrollId} className="hover:bg-slate-50 transition-colors h-12">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.employeeName}</td>
                    <td className="px-6 py-4 text-slate-600 tabular-nums">{row.payrollPeriod}</td>
                    <td className="px-6 py-4 text-slate-600 tabular-nums text-right">{formatRupiah(row.totalEarnings)}</td>
                    <td className="px-6 py-4 text-rose-600 tabular-nums text-right">{formatRupiah(row.totalDeductions)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 tabular-nums text-right">{formatRupiah(row.netSalary)}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={
                          row.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : row.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }
                      >
                        {row.status === "accepted" ? "Disetujui" : row.status === "pending" ? "Menunggu" : "Ditolak"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}