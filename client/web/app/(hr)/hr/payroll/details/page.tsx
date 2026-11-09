"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileSpreadsheet,
  Search,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

type PayrollDetailItem = {
  detailId: number;
  payrollId: number;
  employeeId: string;
  payrollPeriod: string;
  componentId: number;
  componentName: string;
  type: "earning" | "deduction" | string;
  amount: string;
};

type PayrollSlipSummary = {
  payrollId: number;
  employeeId: string;
  firstName: string;
  lastName: string | null;
  payrollPeriod: string;
  totalEarnings: string;
  totalDeductions: string;
  netSalary: string;
};

type Employee = {
  employeeId: string;
  firstName: string;
  lastName: string | null;
};

const formatRupiah = (angka: string | number) => {
  const num = typeof angka === "string" ? parseFloat(angka) : angka;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
};

export default function PayrollDetailsPage() {
  const [details, setDetails] = useState<PayrollDetailItem[]>([]);
  const [summaries, setSummaries] = useState<PayrollSlipSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<"details" | "summaries">("details");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "earning" | "deduction">("all");

  // Modal states
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlipSummary | null>(null);
  const [isSlipDetailOpen, setIsSlipDetailOpen] = useState(false);

  // Generate Payroll modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genEmployeeId, setGenEmployeeId] = useState("");
  const [genPeriod, setGenPeriod] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch details and summaries
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [detailsRes, summariesRes, empRes] = await Promise.all([
        apiFetch("/finance/payrolls"),
        apiFetch("/finance/payrolls/all"),
        apiFetch("/data"),
      ]);

      const [detailsJson, summariesJson, empJson] = await Promise.all([
        detailsRes.json(),
        summariesRes.json(),
        empRes.json(),
      ]);

      if (detailsJson.success && Array.isArray(detailsJson.data)) {
        setDetails(detailsJson.data);
      }
      if (summariesJson.success && Array.isArray(summariesJson.data)) {
        setSummaries(summariesJson.data);
      }
      if (empJson.success && Array.isArray(empJson.data)) {
        setEmployees(empJson.data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setToastMessage({ type: "error", text: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Distinct periods for filter dropdown
  const distinctPeriods = useMemo(() => {
    const periods = new Set<string>();
    details.forEach((d) => d.payrollPeriod && periods.add(d.payrollPeriod));
    summaries.forEach((s) => s.payrollPeriod && periods.add(s.payrollPeriod));
    return Array.from(periods).sort().reverse();
  }, [details, summaries]);

  // Filtered details
  const filteredDetails = useMemo(() => {
    return details.filter((item) => {
      const matchSearch =
        item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.payrollPeriod.includes(searchQuery);
      const matchPeriod = periodFilter === "all" || item.payrollPeriod === periodFilter;
      const matchType = typeFilter === "all" || item.type === typeFilter;
      return matchSearch && matchPeriod && matchType;
    });
  }, [details, searchQuery, periodFilter, typeFilter]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName || ""}`.toLowerCase();
      const matchSearch =
        item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fullName.includes(searchQuery.toLowerCase()) ||
        item.payrollPeriod.includes(searchQuery);
      const matchPeriod = periodFilter === "all" || item.payrollPeriod === periodFilter;
      return matchSearch && matchPeriod;
    });
  }, [summaries, searchQuery, periodFilter]);

  // Handle Generate Payroll (calls POST /finance/payrolls/generate)
  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError("");

    if (!genEmployeeId) {
      setGenerateError("Pilih karyawan terlebih dahulu");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(genPeriod)) {
      setGenerateError("Format periode harus YYYY-MM (contoh: 2026-11)");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await apiFetch("/finance/payrolls/generate", {
        method: "POST",
        body: JSON.stringify({
          employeeId: genEmployeeId,
          payrollPeriod: genPeriod,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal generate payroll");
      }

      setToastMessage({
        type: "success",
        text: `Payroll berhasil di-generate untuk karyawan ${genEmployeeId} periode ${genPeriod}`,
      });
      setIsGenerateOpen(false);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // View Slip breakdown
  const handleViewSlip = (slip: PayrollSlipSummary) => {
    setSelectedSlip(slip);
    setIsSlipDetailOpen(true);
  };

  // Specific components for selected slip
  const selectedSlipDetails = useMemo(() => {
    if (!selectedSlip) return [];
    return details.filter(
      (d) =>
        d.employeeId === selectedSlip.employeeId &&
        d.payrollPeriod === selectedSlip.payrollPeriod
    );
  }, [selectedSlip, details]);

  // Metrics
  const totalDetailsCount = details.length;
  const totalSlipsCount = summaries.length;
  const totalNetPaid = summaries.reduce(
    (sum, s) => sum + (parseFloat(s.netSalary) || 0),
    0
  );
  const totalEarningsAll = summaries.reduce(
    (sum, s) => sum + (parseFloat(s.totalEarnings) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-emerald-600" />
            Detail & Riwayat Payroll
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data get detail breakdown pendapatan dan potongan gaji yang diproses oleh sistem Finance.
          </p>
        </div>

        <Button
          onClick={() => {
            setGenerateError("");
            setIsGenerateOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-4 text-sm font-medium gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Generate Payroll Baru
        </Button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Rincian Komponen Terproses</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalDetailsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Slip Selesai</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{totalSlipsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Pendapatan Kotor</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {formatRupiah(totalEarningsAll)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Gaji Bersih (Net)</p>
            <p className="text-xl font-bold text-teal-700 mt-0.5">
              {formatRupiah(totalNetPaid)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Detail Breakdown vs Summary Slips */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === "details"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Rincian Detail Komponen ({totalDetailsCount})
        </button>

        <button
          onClick={() => setActiveTab("summaries")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === "summaries"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Daftar Slip Gaji Karyawan ({totalSlipsCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "details"
                ? "Cari ID karyawan atau nama komponen..."
                : "Cari nama atau ID karyawan..."
            }
            className="pl-9 h-10 rounded-xl bg-slate-50/70 border-slate-200 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Period Filter */}
          <Select value={periodFilter} onValueChange={(val) => setPeriodFilter(val || "all")}>
            <SelectTrigger className="h-10 rounded-xl text-xs w-full sm:w-44 bg-slate-50/70">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Periode</SelectItem>
              {distinctPeriods.map((p) => (
                <SelectItem key={p} value={p}>
                  Periode {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter (only for details tab) */}
          {activeTab === "details" && (
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600 w-full sm:w-auto">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  typeFilter === "all" ? "bg-white text-slate-900 shadow-xs font-semibold" : "hover:text-slate-900"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter("earning")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  typeFilter === "earning" ? "bg-white text-emerald-700 shadow-xs font-semibold" : "hover:text-slate-900"
                }`}
              >
                Pendapatan
              </button>
              <button
                onClick={() => setTypeFilter("deduction")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  typeFilter === "deduction" ? "bg-white text-rose-700 shadow-xs font-semibold" : "hover:text-slate-900"
                }`}
              >
                Potongan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: DETAILS TABLE */}
      {activeTab === "details" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm">Memuat data detail payroll...</p>
            </div>
          ) : filteredDetails.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Layers className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-base font-semibold text-slate-700">Tidak ada detail payroll ditemukan</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || periodFilter !== "all" || typeFilter !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau filter yang dipilih."
                  : "Belum ada detail payroll yang tercatat dari kalkulasi finance."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-200">
                  <TableHead className="w-16 font-semibold text-slate-700">ID Detail</TableHead>
                  <TableHead className="w-20 font-semibold text-slate-700">ID Payroll</TableHead>
                  <TableHead className="font-semibold text-slate-700">Periode</TableHead>
                  <TableHead className="font-semibold text-slate-700">ID Karyawan</TableHead>
                  <TableHead className="font-semibold text-slate-700">Komponen Gaji</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tipe</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDetails.map((item) => (
                  <TableRow key={item.detailId} className="border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="font-mono text-xs text-slate-500 font-medium">
                      #{item.detailId}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      PR-{item.payrollId}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {item.payrollPeriod}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {item.employeeId}
                    </TableCell>
                    <TableCell className="text-slate-800 font-medium">
                      {item.componentName}
                    </TableCell>
                    <TableCell>
                      {item.type === "earning" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium gap-1 hover:bg-emerald-100">
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          Pendapatan
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-medium gap-1 hover:bg-rose-100">
                          <ArrowDownRight className="w-3 h-3 text-rose-600" />
                          Potongan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-slate-900">
                      {formatRupiah(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* VIEW 2: SUMMARIES SLIP TABLE */}
      {activeTab === "summaries" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm">Memuat data slip gaji...</p>
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Receipt className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-base font-semibold text-slate-700">Tidak ada slip gaji ditemukan</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || periodFilter !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau filter periode."
                  : "Belum ada transaksi penggajian yang diproses oleh finance."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-200">
                  <TableHead className="w-20 font-semibold text-slate-700">ID Slip</TableHead>
                  <TableHead className="font-semibold text-slate-700">Periode</TableHead>
                  <TableHead className="font-semibold text-slate-700">Karyawan</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Total Pendapatan</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Total Potongan</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Gaji Bersih (Net)</TableHead>
                  <TableHead className="w-28 text-right font-semibold text-slate-700">Rincian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.map((slip) => (
                  <TableRow key={slip.payrollId} className="border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      PR-{slip.payrollId}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {slip.payrollPeriod}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {slip.firstName} {slip.lastName || ""}
                      </div>
                      <div className="font-mono text-xs text-slate-500">{slip.employeeId}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-700 font-medium">
                      +{formatRupiah(slip.totalEarnings)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-rose-700 font-medium">
                      -{formatRupiah(slip.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">
                      {formatRupiah(slip.netSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSlip(slip)}
                        className="h-8 px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-medium gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* MODAL: DETAIL BREAKDOWN SLIP GAJI */}
      <Dialog open={isSlipDetailOpen} onOpenChange={setIsSlipDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Rincian Slip Gaji Karyawan
            </DialogTitle>
            <p className="text-xs text-slate-500">
              Breakdown komponen penghasilan dan potongan resmi untuk periode ini.
            </p>
          </DialogHeader>

          {selectedSlip && (
            <div className="space-y-4 pt-2">
              {/* Employee & Period info card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedSlip.firstName} {selectedSlip.lastName || ""}
                  </p>
                  <p className="font-mono text-slate-500 mt-0.5">ID: {selectedSlip.employeeId}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-700">Periode</span>
                  <p className="font-mono font-bold text-emerald-700 text-sm">
                    {selectedSlip.payrollPeriod}
                  </p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <p className="text-xs font-semibold text-slate-700">Daftar Komponen Terhitung:</p>
                {selectedSlipDetails.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Tidak ada rincian komponen yang tersimpan untuk slip ini.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSlipDetails.map((d) => (
                      <div
                        key={d.detailId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          {d.type === "earning" ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span className="font-medium text-slate-800">{d.componentName}</span>
                        </div>
                        <span
                          className={`font-mono font-semibold ${
                            d.type === "earning" ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {d.type === "earning" ? "+" : "-"}
                          {formatRupiah(d.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Totals */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Pendapatan:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    +{formatRupiah(selectedSlip.totalEarnings)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Potongan:</span>
                  <span className="font-mono font-semibold text-rose-700">
                    -{formatRupiah(selectedSlip.totalDeductions)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Gaji Bersih (Net Salary):</span>
                  <span className="font-mono text-emerald-700">
                    {formatRupiah(selectedSlip.netSalary)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setIsSlipDetailOpen(false)}
                  className="rounded-xl h-9 px-4 text-xs font-medium"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: GENERATE PAYROLL */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading">
              Generate Payroll Karyawan
            </DialogTitle>
            <p className="text-xs text-slate-500">
              Hitung dan buatkan transaksi payroll beserta rincian detailnya berdasarkan alokasi komponen gaji yang telah ditetapkan.
            </p>
          </DialogHeader>

          {generateError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{generateError}</span>
            </div>
          )}

          <form onSubmit={handleGeneratePayroll} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Pilih Karyawan <span className="text-rose-500">*</span>
              </Label>
              <Select value={genEmployeeId} onValueChange={(val) => setGenEmployeeId(val || "")}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {employees.map((emp) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      <span className="font-semibold text-slate-900">{emp.employeeId}</span> -{" "}
                      {emp.firstName} {emp.lastName || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Periode Payroll (YYYY-MM) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                required
                value={genPeriod}
                onChange={(e) => setGenPeriod(e.target.value)}
                placeholder="2026-11"
                className="h-10 rounded-xl"
              />
              <p className="text-[11px] text-slate-500">
                Format tahun dan bulan 2 digit (contoh: 2026-11).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateOpen(false)}
                className="rounded-xl h-10 px-4 text-xs font-medium"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 text-xs font-medium gap-1.5"
              >
                {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Generate Payroll
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
