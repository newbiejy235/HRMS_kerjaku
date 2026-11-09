"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Clock,
  PlusCircle,
  Search,
  Eye,
  CheckCircle2,
  Send,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchEmployees,
  fetchOvertimeNotifications,
  createOvertime,
  type NotificationItem,
  type Employee,
} from "@/lib/pengajuan-api";

const formatDate = (s: string) => {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export default function HRLemburDashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overtimeList, setOvertimeList] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State Penugasan Lembur HR
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [overtimeDate, setOvertimeDate] = useState("");
  const [overtimeTotal, setOvertimeTotal] = useState<number | string>(3);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filter & Search Table
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailRow, setDetailRow] = useState<NotificationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const employeeMap = useMemo(() => {
    const m = new Map<string, Employee>();
    employees.forEach((e) => m.set(e.employeeId, e));
    return m;
  }, [employees]);

  // Set default overtimeDate ke waktu sekarang + 1 jam
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setOvertimeDate(now.toISOString().slice(0, 16));
  }, []);

  const loadData = () => {
    setIsLoading(true);
    setErrorMsg("");
    Promise.all([fetchEmployees(), fetchOvertimeNotifications()])
      .then(([emp, list]) => {
        setEmployees(emp);
        setOvertimeList(list);
        if (emp.length > 0 && !selectedEmployee) {
          setSelectedEmployee(emp[0].employeeId);
        }
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Gagal memuat data lembur.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitFeedback(null);

    const totalNum = Number(overtimeTotal);
    if (!selectedEmployee) {
      setSubmitFeedback({ type: "error", message: "Silakan pilih karyawan terlebih dahulu." });
      return;
    }
    if (!overtimeDate) {
      setSubmitFeedback({ type: "error", message: "Tanggal dan jam lembur wajib diisi." });
      return;
    }
    if (!Number.isInteger(totalNum) || totalNum <= 0) {
      setSubmitFeedback({ type: "error", message: "Durasi lembur harus berupa angka bulat positif (jam)." });
      return;
    }

    // Pastikan format ISO datetime memiliki detik (contoh: 2026-12-08T19:49:00)
    let formattedDate = overtimeDate.trim();
    if (formattedDate.length === 16) {
      formattedDate = `${formattedDate}:00`;
    }

    setIsSubmitting(true);
    try {
      const result = await createOvertime({
        id_employee: selectedEmployee,
        overtimeDate: formattedDate,
        overtimeTotal: totalNum,
        description: description.trim() || undefined,
      });

      setSubmitFeedback({
        type: "success",
        message: result?.message || `Lembur berhasil ditugaskan kepada ${selectedEmployee}!`,
      });

      // Reset form
      setDescription("");
      loadData();
    } catch (err: unknown) {
      setSubmitFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menugaskan lembur karyawan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick helper: Set preset durasi jam
  const setPresetHours = (hours: number) => {
    setOvertimeTotal(hours);
  };

  // Quick helper: Isi form contoh cepat
  const fillSample = () => {
    if (employees.length > 0) {
      setSelectedEmployee(employees[0].employeeId);
    }
    setOvertimeTotal(3);
    setDescription("Penyelesaian tugas mendesak dari HR");
  };

  // Filter list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return overtimeList.filter((r) => {
      const emp = employeeMap.get(r.employeeCode);
      const name = emp ? `${emp.firstName} ${emp.lastName || ""}`.toLowerCase() : r.employeeCode.toLowerCase();
      const matchSearch = !q || name.includes(q) || r.employeeCode.toLowerCase().includes(q) || String(r.id).includes(q);
      const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [overtimeList, search, statusFilter, employeeMap]);

  // Statistics
  const stats = useMemo(() => {
    const c = { total: overtimeList.length, accepted: 0, pending: 0 };
    overtimeList.forEach((r) => {
      const s = r.status.toLowerCase();
      if (s === "accepted" || s === "approved") c.accepted++;
      else if (s === "pending") c.pending++;
    });
    return c;
  }, [overtimeList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                Dashboard Penugasan Lembur
              </h1>
              <p className="text-sm text-slate-500">
                Berikan instruksi lembur langsung dari HR ke karyawan. Lembur otomatis berstatus <b>Accepted</b>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/hr/pengajuan/lembur">
            <Button variant="outline" className="border-slate-300 flex items-center gap-1.5 text-xs sm:text-sm">
              Tinjau Pengajuan Karyawan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Riwayat Lembur</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600">Lembur Disetujui / Diberikan</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.accepted}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-600">Pengajuan Pending Karyawan</p>
            <p className="mt-2 text-3xl font-bold text-amber-600 tabular-nums">{stats.pending}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Form di Kiri/Atas & Tabel di Bawah */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card Formulir Penugasan Lembur */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-900">Formulir Tugaskan Lembur</h2>
            </div>
            <button
              type="button"
              onClick={fillSample}
              className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Isi Contoh
            </button>
          </div>

          <form onSubmit={handleCreateOvertime} className="space-y-4">
            {/* Pilih Karyawan */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Pilih Karyawan</Label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.firstName} {emp.lastName || ""} ({emp.employeeId})
                  </option>
                ))}
              </select>
              {selectedEmployee && employeeMap.get(selectedEmployee) && (
                <p className="text-xs text-slate-500">
                  Email: {employeeMap.get(selectedEmployee)?.email}
                </p>
              )}
            </div>

            {/* Tanggal & Waktu Lembur */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Tanggal & Waktu Mulai Lembur</Label>
              <Input
                type="datetime-local"
                value={overtimeDate}
                onChange={(e) => setOvertimeDate(e.target.value)}
                className="h-10 rounded-lg border-slate-300"
                required
              />
              <p className="text-[11px] text-slate-400">
                Format otomatis: <code className="text-slate-600">{overtimeDate ? `${overtimeDate}:00` : "-"}</code>
              </p>
            </div>

            {/* Total Jam Lembur */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Durasi Lembur (Jam)</Label>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 mr-1">Pilih cepat:</span>
                  {[1, 2, 3, 4, 5].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setPresetHours(h)}
                      className={`px-2 py-0.5 rounded border text-xs ${
                        Number(overtimeTotal) === h
                          ? "bg-emerald-100 border-emerald-400 text-emerald-800 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {h} Jam
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                min={1}
                max={24}
                value={overtimeTotal}
                onChange={(e) => setOvertimeTotal(e.target.value)}
                placeholder="Contoh: 3"
                className="h-10 rounded-lg border-slate-300"
                required
              />
            </div>

            {/* Deskripsi / Instruksi Lembur */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Instruksi / Catatan Lembur</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: lu sekarang lembur / Penyelesaian modul laporan bulanan..."
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Feedback Alert */}
            {submitFeedback && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  submitFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {submitFeedback.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white h-11 rounded-lg flex items-center justify-center gap-2 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim Penugasan...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Kirim & Beri Tugas Lembur
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Tabel Riwayat Lembur di Kanan */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daftar Jadwal & Riwayat Lembur</h2>
              <p className="text-xs text-slate-500">Semua tugas lembur yang aktif dan tercatat di sistem.</p>
            </div>
            <Button onClick={loadData} variant="outline" size="sm" className="h-9">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID lembur / ID karyawan..."
                className="pl-9 h-9 text-xs rounded-lg border-slate-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-xs rounded-lg border-slate-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Karyawan</TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                    </TableCell>
                  </TableRow>
                ) : errorMsg ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-rose-600 text-xs">
                      {errorMsg}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada data lembur ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 15).map((row) => {
                    const emp = employeeMap.get(row.employeeCode);
                    const name = emp ? `${emp.firstName} ${emp.lastName || ""}`.trim() : row.employeeCode;
                    const isAccepted = row.status.toLowerCase() === "accepted";

                    return (
                      <TableRow key={row.id} className="hover:bg-slate-50 h-11 text-xs">
                        <TableCell className="font-semibold text-slate-800">{row.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{name}</div>
                          <div className="text-[11px] text-slate-400">{row.employeeCode}</div>
                        </TableCell>
                        <TableCell className="text-slate-600">{formatDate(row.date)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              isAccepted
                                ? "bg-emerald-100 text-emerald-800 text-[10px]"
                                : "bg-amber-100 text-amber-800 text-[10px]"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setDetailRow(row);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 15 && (
            <p className="text-right text-xs text-slate-400">Menampilkan 15 dari {filtered.length} lembur.</p>
          )}
        </div>
      </div>

      {/* Modal Detail */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-xl border-slate-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
              Detail Penugasan Lembur #{detailRow?.id}
            </DialogTitle>
          </DialogHeader>
          {detailRow && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Lembur</span>
                <span className="font-semibold text-slate-900">{detailRow.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Karyawan</span>
                <span className="font-medium text-slate-900">
                  {employeeMap.get(detailRow.employeeCode)?.firstName}{" "}
                  {employeeMap.get(detailRow.employeeCode)?.lastName || ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Karyawan</span>
                <span className="font-mono text-slate-800">{detailRow.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal & Waktu</span>
                <span className="font-medium text-slate-900">{formatDate(detailRow.date)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Status</span>
                <Badge className="bg-emerald-100 text-emerald-800">{detailRow.status}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
