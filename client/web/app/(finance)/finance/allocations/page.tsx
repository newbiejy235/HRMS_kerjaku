"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Plus,
  Pencil,
  Search,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Wallet,
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

type Allocation = {
  allocationId: number;
  employeeId: string;
  employeeName: string | null;
  componentId: number;
  componentName: string;
  type: "earning" | "deduction" | string;
  amount: string;
};

type Employee = {
  employeeId: string;
  firstName: string;
  lastName: string | null;
  positionId?: number;
};

type ComponentItem = {
  id: number;
  componentName: string;
  type: "earning" | "deduction";
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

export default function PayrollAllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<
    "all" | "earning" | "deduction"
  >("all");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all");

  // Modal dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(
    null,
  );
  const [formData, setFormData] = useState({
    employeeId: "",
    componentId: "",
    amount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch all necessary data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allocRes, empRes, compRes] = await Promise.all([
        apiFetch("/finance/allocations"),
        apiFetch("/data"),
        apiFetch("/finance/components"),
      ]);

      const [allocJson, empJson, compJson] = await Promise.all([
        allocRes.json(),
        empRes.json(),
        compRes.json(),
      ]);

      if (allocJson.success && Array.isArray(allocJson.data)) {
        setAllocations(allocJson.data);
      }

      if (empJson.success && Array.isArray(empJson.data)) {
        setEmployees(empJson.data);
      }

      if (compJson.success && Array.isArray(compJson.data)) {
        setComponents(compJson.data);
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

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Open modal Create
  const handleOpenCreate = () => {
    setEditingAllocation(null);
    setFormData({
      employeeId: "",
      componentId: "",
      amount: "",
    });
    setDialogError("");
    setIsDialogOpen(true);
  };

  // Open modal Edit
  const handleOpenEdit = (item: Allocation) => {
    setEditingAllocation(item);
    setFormData({
      employeeId: item.employeeId,
      componentId: String(item.componentId),
      amount: String(parseFloat(item.amount) || 0),
    });
    setDialogError("");
    setIsDialogOpen(true);
  };

  // Submit allocation (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError("");

    if (!formData.employeeId) {
      setDialogError("Pilih karyawan terlebih dahulu");
      return;
    }
    if (!formData.componentId) {
      setDialogError("Pilih komponen gaji terlebih dahulu");
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setDialogError("Nominal gaji harus berupa angka lebih dari 0");
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /finance/allocations (performs upsert)
      const res = await apiFetch("/finance/allocations", {
        method: "POST",
        body: JSON.stringify({
          employeeId: formData.employeeId,
          componentId: Number(formData.componentId),
          amount: numAmount,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal mengalokasikan komponen gaji");
      }

      setToastMessage({
        type: "success",
        text: editingAllocation
          ? "Nominal alokasi gaji berhasil diperbarui"
          : "Alokasi komponen gaji berhasil disimpan",
      });
      setIsDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan alokasi";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalAllocations = allocations.length;
  const totalEarningAmount = allocations
    .filter((a) => a.type === "earning")
    .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

  const hasil = totalEarningAmount / allocations.length;

  const totalDeductionAmount = allocations
    .filter((a) => a.type === "deduction")
    .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const uniqueEmployeeCount = new Set(allocations.map((a) => a.employeeId))
    .size;

  // Filtered allocations
  const filteredAllocations = useMemo(() => {
    return allocations.filter((item) => {
      const matchSearch =
        item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.employeeName &&
          item.employeeName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        item.componentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = selectedType === "all" || item.type === selectedType;
      const matchEmp =
        filterEmployeeId === "all" || item.employeeId === filterEmployeeId;
      return matchSearch && matchType && matchEmp;
    });
  }, [allocations, searchQuery, selectedType, filterEmployeeId]);

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
            <UserCheck className="h-7 w-7 text-emerald-600" />
            Alokasi Gaji Karyawan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tetapkan besaran tunjangan, gaji pokok, atau potongan rutin bulanan
            untuk setiap karyawan.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-4 text-sm font-medium gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Atur Alokasi Gaji
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Alokasi</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalAllocations}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              Average Pendapatan Rutin
            </p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {formatRupiah(hasil)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Potongan Rutin
            </p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">
              {formatRupiah(totalDeductionAmount)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              Karyawan Teralokasi
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">
              {uniqueEmployeeCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID, nama karyawan, komponen..."
            className="pl-9 h-10 rounded-xl bg-slate-50/70 border-slate-200 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Employee Filter */}
          <Select
            value={filterEmployeeId}
            onValueChange={(val) => setFilterEmployeeId(val || "all")}
          >
            <SelectTrigger className="h-10 rounded-xl text-xs w-full sm:w-48 bg-slate-50/70">
              <SelectValue placeholder="Semua Karyawan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Karyawan</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeId} - {emp.firstName} {emp.lastName || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600 w-full sm:w-auto">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedType === "all"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Semua ({totalAllocations})
            </button>
            <button
              onClick={() => setSelectedType("earning")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedType === "earning"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Pendapatan
            </button>
            <button
              onClick={() => setSelectedType("deduction")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedType === "deduction"
                  ? "bg-white text-rose-700 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Potongan
            </button>
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat data alokasi gaji...</p>
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Wallet className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-base font-semibold text-slate-700">
              Tidak ada alokasi ditemukan
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ||
              selectedType !== "all" ||
              filterEmployeeId !== "all"
                ? "Coba sesuaikan kata kunci pencarian atau filter yang diterapkan."
                : "Belum ada komponen gaji yang dialokasikan ke karyawan. Klik tombol di atas untuk membuat alokasi."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="w-16 font-semibold text-slate-700">
                  ID
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  ID Karyawan
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Nama Karyawan
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Komponen Gaji
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Tipe
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">
                  Nominal
                </TableHead>
                <TableHead className="w-24 text-right font-semibold text-slate-700">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAllocations.map((item) => (
                <TableRow
                  key={item.allocationId}
                  className="border-slate-100 hover:bg-slate-50/60 transition-colors"
                >
                  <TableCell className="font-mono text-xs text-slate-500 font-medium">
                    #{item.allocationId}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-800">
                    {item.employeeId}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {item.employeeName || "-"}
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-8 px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-medium gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Ubah
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Modal: Assign / Edit Allocation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading">
              {editingAllocation
                ? "Ubah Nominal Alokasi Gaji"
                : "Tetapkan Alokasi Komponen Gaji"}
            </DialogTitle>
            <p className="text-xs text-slate-500">
              {editingAllocation
                ? "Sesuaikan besaran nominal rutin untuk komponen karyawan ini."
                : "Pilih karyawan dan tautkan dengan komponen gaji beserta besaran nominalnya."}
            </p>
          </DialogHeader>

          {dialogError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{dialogError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Employee Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Pilih Karyawan <span className="text-rose-500">*</span>
              </Label>
              <Select
                disabled={!!editingAllocation}
                value={formData.employeeId}
                onValueChange={(val) =>
                  setFormData({ ...formData, employeeId: val || "" })
                }
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {employees.map((emp) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      <span className="font-semibold text-slate-900">
                        {emp.employeeId}
                      </span>{" "}
                      - {emp.firstName} {emp.lastName || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Component Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Komponen Gaji <span className="text-rose-500">*</span>
              </Label>
              <Select
                disabled={!!editingAllocation}
                value={formData.componentId}
                onValueChange={(val) =>
                  setFormData({ ...formData, componentId: val || "" })
                }
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Pilih komponen gaji..." />
                </SelectTrigger>
                <SelectContent>
                  {components.map((comp) => (
                    <SelectItem key={comp.id} value={String(comp.id)}>
                      <div className="flex items-center gap-2">
                        <span>{comp.componentName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            comp.type === "earning"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {comp.type === "earning" ? "Pendapatan" : "Potongan"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Nominal Rutin (IDR) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Rp
                </span>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Contoh: 5000000"
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  Terbaca: {formatRupiah(formData.amount)}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl h-10 px-4 text-xs font-medium"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 text-xs font-medium gap-1.5"
              >
                {isSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {editingAllocation ? "Simpan Perubahan" : "Simpan Alokasi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
