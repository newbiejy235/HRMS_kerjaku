"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type Payroll = {
  payrollId: number;
  employeeId: string;
  payrollPeriod: string;
  totalEarnings: string;
  totalDeductions: string;
  netSalary: string;
};

type Employee = {
  employeeId: string;
  firstName: string;
  lastName?: string | null;
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
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Generate payroll states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genEmployeeId, setGenEmployeeId] = useState("");
  const [genPeriod, setGenPeriod] = useState(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Mengambil data payroll dan karyawan
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const [payrollRes, employeeRes] = await Promise.all([
        apiFetch("/finance/payrolls/all"),
        apiFetch("/data"),
      ]);

      const [payrollJson, employeeJson] = await Promise.all([
        payrollRes.json(),
        employeeRes.json(),
      ]);

      if (!payrollRes.ok || !payrollJson.success) {
        throw new Error(
          payrollJson.message || "Gagal mengambil data penggajian.",
        );
      }

      setPayrolls(Array.isArray(payrollJson.data) ? payrollJson.data : []);

      if (employeeRes.ok && employeeJson.success) {
        setEmployees(Array.isArray(employeeJson.data) ? employeeJson.data : []);
      } else {
        console.error("Gagal mengambil data karyawan:", employeeJson.message);
      }
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate payroll
  const handleGeneratePayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setGenerateError("");
    setSuccessMessage("");

    if (!genEmployeeId) {
      setGenerateError("Pilih karyawan terlebih dahulu.");
      return;
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(genPeriod)) {
      setGenerateError("Format periode harus YYYY-MM (contoh: 2026-11).");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiFetch("/finance/payrolls/generate", {
        method: "POST",
        body: JSON.stringify({
          employeeId: genEmployeeId,
          payrollPeriod: genPeriod,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal melakukan generate payroll.");
      }

      setSuccessMessage(
        `Payroll berhasil dibuat untuk karyawan ${genEmployeeId}, periode ${genPeriod}.`,
      );

      setIsGenerateOpen(false);
      setGenEmployeeId("");

      // Refresh data payroll setelah berhasil generate
      await fetchData();
    } catch (error) {
      setGenerateError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat generate payroll.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const totalPengeluaran = payrolls.reduce(
    (acc, curr) => acc + parseFloat(curr.netSalary || "0"),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Penggajian
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar riwayat dan status penggajian karyawan.
          </p>
        </div>

        <Button
          onClick={() => {
            setGenerateError("");
            setSuccessMessage("");
            setIsGenerateOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Payroll Baru
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Total Pengeluaran Gaji
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {formatRupiah(totalPengeluaran)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Total Karyawan Digaji
          </p>
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

      {/* Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nama Karyawan</th>
                <th className="px-6 py-3 font-medium">Periode</th>
                <th className="px-6 py-3 font-medium text-right">Pendapatan</th>
                <th className="px-6 py-3 font-medium text-right">Potongan</th>
                <th className="px-6 py-3 font-medium text-right">
                  Gaji Bersih
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-rose-600"
                  >
                    {errorMsg}
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Belum ada data penggajian.
                  </td>
                </tr>
              ) : (
                payrolls.map((row) => (
                  <tr
                    key={row.payrollId}
                    className="hover:bg-slate-50 transition-colors h-12"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.employeeId}
                    </td>

                    <td className="px-6 py-4 text-slate-600 tabular-nums">
                      {row.payrollPeriod}
                    </td>

                    <td className="px-6 py-4 text-slate-600 tabular-nums text-right">
                      {formatRupiah(row.totalEarnings)}
                    </td>

                    <td className="px-6 py-4 text-rose-600 tabular-nums text-right">
                      {formatRupiah(row.totalDeductions)}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900 tabular-nums text-right">
                      {formatRupiah(row.netSalary)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payroll Dialog */}
      <Dialog
        open={isGenerateOpen}
        onOpenChange={(open) => {
          setIsGenerateOpen(open);

          if (!open) {
            setGenerateError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Generate Payroll Baru</DialogTitle>
            <DialogDescription>
              Pilih karyawan dan periode untuk membuat data penggajian.
            </DialogDescription>
          </DialogHeader>

          {generateError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {generateError}
            </div>
          )}

          <form onSubmit={handleGeneratePayroll} className="space-y-5">
            <div className="space-y-2">
              <Label>Pilih Karyawan</Label>

              <Select
                value={genEmployeeId}
                onValueChange={setGenEmployeeId}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>

                <SelectContent>
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.employeeId} - {emp.firstName} {emp.lastName || ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      Tidak ada data karyawan.
                    </div>
                  )}
                </SelectContent>
              </Select>

              {employees.length === 0 && (
                <p className="text-xs text-rose-500">
                  Data karyawan belum tersedia. Periksa endpoint /data.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Periode Payroll (YYYY-MM)</Label>

              <Input
                type="month"
                value={genPeriod}
                onChange={(e) => setGenPeriod(e.target.value)}
                disabled={isGenerating}
              />

              <p className="text-xs text-slate-500">Contoh periode: 2026-11</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateOpen(false)}
                disabled={isGenerating}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={isGenerating || employees.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Generate Payroll"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
