"use client";

import { useState, useEffect } from "react";
import { Loader2, Wallet, Users, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Payroll = {
  payrollId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  payrollPeriod: string;
  totalEarnings: string;
  totalDeductions: string;
  netSalary: string;
};

const formatRupiah = (angka: string | number) => {
  const num = typeof angka === "string" ? parseFloat(angka) : angka;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);
};

export default function FinanceDashboardPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiFetch("/finance/payrolls/all");
        const result = await response.json();
        if (result.success) {
          setPayrolls(result.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalPengeluaran = payrolls.reduce(
    (acc, curr) => acc + parseFloat(curr.netSalary || "0"),
    0,
  );

  const totalKaryawan = new Set(payrolls.map((p) => p.firstName)).size;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
          Dashboard Finance
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan penggajian dan status keuangan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-medium text-slate-500">
              Total Gaji Disetujui
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">
            {formatRupiah(totalPengeluaran)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-slate-600" />
            <p className="text-xs font-medium text-slate-500">Total Karyawan</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">
            {totalKaryawan} Orang
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Aktivitas Penggajian Terbaru
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">id</th>
                <th className="px-6 py-3 font-medium">employee code</th>
                <th className="px-6 py-3 font-medium">Nama Karyawan</th>
                <th className="px-6 py-3 font-medium">Periode</th>
                <th className="px-6 py-3 font-medium text-right">
                  Gaji Bersih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payrolls.slice(0, 5).map((row) => (
                <tr
                  key={row.payrollId}
                  className="hover:bg-slate-50 transition-colors h-12"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.payrollId}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.employeeId}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 tabular-nums">
                    {row.payrollPeriod}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 tabular-nums text-right">
                    {formatRupiah(row.netSalary)}
                  </td>
                  <td className="px-6 py-4 text-center"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
