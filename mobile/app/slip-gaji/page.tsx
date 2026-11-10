"use client";


import { useEffect, useState } from "react";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import {
  Receipt,
  Clock,
  Banknote,
  Calendar,
  User,
  Hash,
  Wallet,
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";

import {
  dashboardService,
  SlipGaji,
} from "../../lib/services/dashboardService";

const formatRupiah = (amount: string | number) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="space-y-1 min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
      {label}
    </p>
    <p className="text-sm font-black text-neutral-900 break-all">{value}</p>
  </div>
);

export default function SlipGajiPage() {
  const [slip, setSlip] = useState<SlipGaji | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSlip();
  }, []);

  const loadSlip = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await dashboardService.getSlipGaji();
      setSlip(data);
    } catch {
      setErrorMsg("Data slip gaji belum bisa dimuat");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PlaceholderLayout
        title="Slip Gaji"
        subtitle="Rincian gaji dan tunjangan bulanan"
        badge="Slip Gaji"
      >
        <div className="flex-1 flex flex-col justify-center items-center space-y-3 p-6">
          <div className="h-4 bg-neutral-200/60 rounded-full w-24 animate-pulse" />
          <div className="h-4 bg-neutral-200/60 rounded-full w-40 animate-pulse" />
          <div className="h-4 bg-neutral-200/60 rounded-full w-56 animate-pulse" />
        </div>
      </PlaceholderLayout>
    );
  }

  if (errorMsg || !slip) {
    return (
      <PlaceholderLayout
        title="Slip Gaji"
        subtitle="Rincian gaji dan tunjangan bulanan"
        badge="Slip Gaji"
      >
        <div className="flex-1 flex flex-col justify-center items-center space-y-3 text-center p-6">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-900 bg-neutral-200 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-neutral-600" />
          </div>

          <h2 className="text-base font-extrabold text-neutral-900">
            {errorMsg || "Data slip gaji belum tersedia"}
          </h2>

          <p className="text-xs text-neutral-500">
            Coba muat ulang untuk mengambil data terbaru.
          </p>

          <button
            type="button"
            onClick={loadSlip}
            className="flex items-center gap-2 py-2.5 px-5 rounded-full bg-neutral-900 text-white font-bold text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Coba lagi
          </button>
        </div>
      </PlaceholderLayout>
    );
  }

  const { payroll, details } = slip;

  return (
    <PlaceholderLayout
      title="Slip Gaji"
      subtitle="Rincian gaji dan tunjangan bulanan"
      badge="Slip Gaji"
    >
      <div className="flex-1 flex flex-col space-y-5">
        {/* HEADER SLIP GAJI */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[2px_2px_0px_0px_#171717]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Slip Gaji Periode
              </p>
              <h2 className="text-2xl font-black text-neutral-900">
                {payroll.payrollPeriod}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-full border-2 border-neutral-900 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-neutral-200">
            <InfoItem label="Payroll ID" value={payroll.payrollId} />
            <InfoItem label="Employee ID" value={payroll.employeeId} />
          </div>
        </div>

        {/* RINGKASAN GAJI */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Ringkasan Gaji
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 shadow-[2px_2px_0px_0px_#171717]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase text-neutral-500">
                  Total Pendapatan
                </p>
              </div>

              <p className="text-xl font-black text-neutral-900">
                {formatRupiah(payroll.totalEarnings)}
              </p>
            </div>

            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 shadow-[2px_2px_0px_0px_#171717]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase text-neutral-500">
                  Total Potongan
                </p>
              </div>

              <p className="text-xl font-black text-neutral-900">
                {formatRupiah(payroll.totalDeductions)}
              </p>
            </div>
          </div>

          <div className="bg-[#F4EFE6] border-2 border-neutral-900 rounded-2xl p-5 shadow-[2px_2px_0px_0px_#171717]">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-5 h-5" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                Total Gaji Bersih / Diterima
              </p>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-neutral-900">
              {formatRupiah(payroll.netSalary)}
            </p>
          </div>
        </div>

        {/* DETAIL PENDAPATAN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Detail Pendapatan
            </h3>

            <span className="text-[10px] font-bold bg-neutral-200 px-3 py-1 rounded-full">
              {details.earnings.length} Komponen
            </span>
          </div>

          {details.earnings.length > 0 ? (
            details.earnings.map((item) => (
              <div
                key={item.detailId}
                className="bg-white border-2 border-neutral-900 rounded-2xl p-4 shadow-[2px_2px_0px_0px_#171717]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-neutral-900">
                      {item.componentName}
                    </p>

                    <p className="text-[11px] text-neutral-500 mt-1">
                      {item.type.toUpperCase()}
                    </p>
                  </div>

                  <p className="text-sm font-black whitespace-nowrap">
                    {formatRupiah(item.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-dashed border-neutral-300">
                  <InfoItem label="Detail ID" value={item.detailId} />
                  <InfoItem label="Component NAME" value={item.componentName} />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-5 text-center">
              <p className="text-sm text-neutral-500">
                Belum ada data pendapatan.
              </p>
            </div>
          )}
        </div>

        {/* DETAIL POTONGAN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Detail Potongan
            </h3>

            <span className="text-[10px] font-bold bg-neutral-200 px-3 py-1 rounded-full">
              {details.deductions.length} Komponen
            </span>
          </div>

          {details.deductions.length > 0 ? (
            details.deductions.map((item) => (
              <div
                key={item.detailId}
                className="bg-white border-2 border-neutral-900 rounded-2xl p-4 shadow-[2px_2px_0px_0px_#171717]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-neutral-900">
                      {item.componentName}
                    </p>

                    <p className="text-[11px] text-neutral-500 mt-1">
                      {item.type.toUpperCase()}
                    </p>
                  </div>

                  <p className="text-sm font-black whitespace-nowrap">
                    {formatRupiah(item.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-dashed border-neutral-300">
                  <InfoItem label="Detail ID" value={item.detailId} />
                  <InfoItem label="Component ID" value={item.componentId} />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-5 text-center">
              <p className="text-sm font-bold text-neutral-700">
                Tidak ada potongan gaji.
              </p>

              <p className="text-xs text-neutral-500 mt-1">
                Total potongan bulan ini adalah Rp0.
              </p>
            </div>
          )}
        </div>

        {/* INFORMASI */}
        <div className="p-4 bg-[#F4EFE6] border-2 border-neutral-900 rounded-2xl text-[11px] text-neutral-700 leading-relaxed">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck className="w-4 h-4 text-neutral-900" />
            <p className="font-black text-neutral-900">Informasi Slip Gaji</p>
          </div>
          Seluruh informasi pendapatan, potongan, dan total gaji diambil
          langsung dari sistem HR melalui API. Slip ini menampilkan data periode{" "}
          <strong>{payroll.payrollPeriod}</strong>.
        </div>
      </div>
    </PlaceholderLayout>
  );
}
