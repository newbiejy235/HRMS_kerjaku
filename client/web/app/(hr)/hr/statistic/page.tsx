"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Timer,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AttendanceStatistic,
  fetchAttendanceStatistics,
  generateAttendanceStatistics,
} from "@/lib/statistic-api";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const YEAR_MIN = 2000;

// Periode berjalan dibaca dari "external store" agar nilainya dihitung di
// perangkat pengunjung, bukan dibekukan saat prerender (build statis).
let cachedNow: { month: number; year: number } | null = null;

function subscribeNow(onStoreChange: () => void) {
  onStoreChange();
  return () => {};
}

function getNowSnapshot() {
  if (!cachedNow) {
    const d = new Date();
    cachedNow = { month: d.getMonth() + 1, year: d.getFullYear() };
  }
  return cachedNow;
}

function getNowServerSnapshot() {
  return null;
}

type Period = { month: number; year: number };

export default function StatisticPage() {
  const now = useSyncExternalStore(subscribeNow, getNowSnapshot, getNowServerSnapshot);

  // null = otomatis mengikuti periode berjalan
  const [period, setPeriod] = useState<Period | null>(null);

  const month = period?.month ?? now?.month;
  const year = period?.year ?? now?.year;

  const [rows, setRows] = useState<AttendanceStatistic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (month === undefined || year === undefined) return;

    let ignore = false;

    const fetchData = async () => {
      try {
        const result = await fetchAttendanceStatistics(month, year);
        if (ignore) return;

        if (result.success) {
          setRows(result.data ?? []);
          setErrorMsg("");
        } else {
          setRows([]);
          setErrorMsg(result.message || "Gagal mengambil statistik kehadiran.");
        }
      } catch {
        if (ignore) return;
        setRows([]);
        setErrorMsg("Tidak dapat terhubung ke server.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [month, year, reloadKey]);

  const isCurrentPeriod =
    now !== null && month === now.month && year === now.year;
  const isFuturePeriod =
    now !== null &&
    year !== undefined &&
    month !== undefined &&
    (year > now.year || (year === now.year && month > now.month));

  const changePeriod = (next: Period) => {
    setPeriod(next);
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handlePrev = () => {
    if (month === undefined || year === undefined) return;
    const nextMonth = month === 1 ? 12 : month - 1;
    const nextYear = month === 1 ? year - 1 : year;
    if (nextYear < YEAR_MIN) return;
    changePeriod({ month: nextMonth, year: nextYear });
  };

  const handleNext = () => {
    if (month === undefined || year === undefined || !now) return;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    if (nextYear > now.year || (nextYear === now.year && nextMonth > now.month)) {
      return;
    }
    changePeriod({ month: nextMonth, year: nextYear });
  };

  const canGoPrev = !(
    year !== undefined &&
    month !== undefined &&
    year <= YEAR_MIN &&
    month <= 1
  );
  const canGoNext = !(
    now !== null &&
    year !== undefined &&
    month !== undefined &&
    (year > now.year || (year === now.year && month >= now.month))
  );

  const handleGenerate = async () => {
    if (month === undefined || year === undefined) return;

    setIsGenerating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await generateAttendanceStatistics(month, year);

      if (!result.success) {
        setErrorMsg(result.message || "Gagal generate statistik kehadiran.");
        return;
      }

      setSuccessMsg(
        `${result.message} — ${result.totalEmployees ?? 0} karyawan untuk ${MONTHS[month - 1]} ${year}.`,
      );

      setIsLoading(true);
      setReloadKey((k) => k + 1);
    } catch {
      setErrorMsg("Tidak dapat terhubung ke server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = () => {
    if (month === undefined || year === undefined) return;
    setSuccessMsg("");
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  };

  const summary = rows.reduce(
    (acc, row) => ({
      effective: acc.effective + row.totalEffectiveDays,
      present: acc.present + row.totalPresent,
      permission: acc.permission + row.totalPermission,
      alpha: acc.alpha + row.totalAlpha,
      late: acc.late + row.totalLate,
      overtime: acc.overtime + row.totalOvertime,
    }),
    { effective: 0, present: 0, permission: 0, alpha: 0, late: 0, overtime: 0 },
  );

  const attendanceRate =
    summary.effective > 0
      ? Math.round((summary.present / summary.effective) * 100)
      : 0;

  const maxYear = now?.year ?? YEAR_MIN;
  const yearOptions = Array.from(
    { length: maxYear - YEAR_MIN + 1 },
    (_, i) => maxYear - i,
  );

  const periodLabel =
    month !== undefined && year !== undefined
      ? `${MONTHS[month - 1]} ${year}`
      : "";

  const summaryCards = [
    {
      label: "Karyawan",
      value: rows.length,
      icon: Users,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Tingkat Kehadiran",
      value: `${attendanceRate}%`,
      icon: UserCheck,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Hadir",
      value: summary.present,
      icon: CheckCircle2,
      tone: "text-sky-600 bg-sky-50",
    },
    {
      label: "Izin",
      value: summary.permission,
      icon: UserCheck,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Alpha",
      value: summary.alpha,
      icon: UserX,
      tone: "text-rose-600 bg-rose-50",
    },
    {
      label: "Terlambat",
      value: summary.late,
      icon: AlertCircle,
      tone: "text-orange-600 bg-orange-50",
    },
    {
      label: "Lembur (jam)",
      value: summary.overtime,
      icon: Timer,
      tone: "text-violet-600 bg-violet-50",
    },
  ];

  const rateTone =
    attendanceRate >= 90
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : attendanceRate >= 75
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Statistik Kehadiran
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate statistik kehadiran karyawan dan tinjau per periode.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || isLoading || isFuturePeriod || month === undefined}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-4 text-sm font-medium gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menghitung Statistik...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Statistik
            </>
          )}
        </Button>
      </div>

      {/* Period selector */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          Periode
          {isCurrentPeriod && (
            <span className="ml-1 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Periode berjalan
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={!canGoPrev}
            title="Periode sebelumnya"
            className="h-9 w-9 rounded-lg border-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={month !== undefined ? String(month) : undefined}
            onValueChange={(v) => {
              if (year === undefined) return;
              changePeriod({ month: Number(v), year });
            }}
          >
            <SelectTrigger className="w-36 h-9 text-sm rounded-lg border-slate-300">
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={name} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={year !== undefined ? String(year) : undefined}
            onValueChange={(v) => {
              if (month === undefined) return;
              changePeriod({ month, year: Number(v) });
            }}
          >
            <SelectTrigger className="w-28 h-9 text-sm rounded-lg border-slate-300">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!canGoNext}
            title="Periode berikutnya"
            className="h-9 w-9 rounded-lg border-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="xl:ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || month === undefined}
            className="h-9 rounded-lg border-slate-300 text-sm gap-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Muat Ulang
          </Button>
        </div>

        {isFuturePeriod && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            Periode mendatang belum dapat digenerate.
          </p>
        )}
      </div>

      {/* Banners */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary */}
      {!isLoading && rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-4"
            >
              <div
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                  card.tone,
                )}
              >
                <card.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xl font-semibold text-slate-900 tabular-nums">
                {card.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Statistik per Karyawan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {periodLabel
                ? `Periode ${periodLabel}`
                : "Memuat periode berjalan..."}
            </p>
          </div>
          {!isLoading && !errorMsg && rows.length > 0 && (
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
              {rows.length} karyawan
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Karyawan</th>
                <th className="px-6 py-3 font-medium">ID Karyawan</th>
                <th className="px-6 py-3 font-medium text-center">Hari Efektif</th>
                <th className="px-6 py-3 font-medium text-center">Hadir</th>
                <th className="px-6 py-3 font-medium text-center">Izin</th>
                <th className="px-6 py-3 font-medium text-center">Alpha</th>
                <th className="px-6 py-3 font-medium text-center">Terlambat</th>
                <th className="px-6 py-3 font-medium text-center">Lembur (jam)</th>
                <th className="px-6 py-3 font-medium text-center">Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Memuat statistik kehadiran...
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-rose-500">
                    {errorMsg}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 px-6">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                        <Sparkles className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Belum ada statistik untuk periode{" "}
                          {periodLabel || "ini"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Generate statistik untuk menghitung kehadiran seluruh
                          karyawan pada periode ini.
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerate}
                        disabled={
                          isGenerating || isFuturePeriod || month === undefined
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 text-sm gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Menghitung...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Statistik
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const rate =
                    row.totalEffectiveDays > 0
                      ? Math.round(
                          (row.totalPresent / row.totalEffectiveDays) * 100,
                        )
                      : 0;
                  const rowRateTone =
                    rate >= 90
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : rate >= 75
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {row.firstName} {row.lastName || ""}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {row.employeeId}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 tabular-nums">
                        {row.totalEffectiveDays}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 tabular-nums">
                        {row.totalPresent}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 tabular-nums">
                        {row.totalPermission}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 tabular-nums">
                        {row.totalAlpha}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 tabular-nums">
                        {row.totalLate}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 tabular-nums">
                        {row.totalOvertime}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
                            rowRateTone,
                          )}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && !errorMsg && rows.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>
              Total hari efektif:{" "}
              <strong className="text-slate-700 tabular-nums">
                {summary.effective}
              </strong>
            </span>
            <span>
              Total hadir:{" "}
              <strong className="text-slate-700 tabular-nums">
                {summary.present}
              </strong>
            </span>
            <span>
              Tingkat kehadiran:{" "}
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 font-medium tabular-nums",
                  rateTone,
                )}
              >
                {attendanceRate}%
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
