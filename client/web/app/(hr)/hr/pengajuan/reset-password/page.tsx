"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Search, Eye, CheckCircle2, XCircle, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  fetchResetPasswordNotifications,
  reviewResetPassword,
  type NotificationItem,
  type Employee,
} from "@/lib/pengajuan-api";

const formatDate = (s: string) => {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

const statusBadgeClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === "approved" || s === "accepted") return "bg-emerald-100 text-emerald-700";
  if (s === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

export default function ResetPasswordPage() {
  const [data, setData] = useState<NotificationItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailRow, setDetailRow] = useState<NotificationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const employeeMap = useMemo(() => {
    const m = new Map<string, Employee>();
    employees.forEach((e) => m.set(e.employeeId, e));
    return m;
  }, [employees]);

  const loadData = () => {
    setIsLoading(true);
    setErrorMsg("");
    Promise.all([fetchEmployees(), fetchResetPasswordNotifications()])
      .then(([emp, rows]) => {
        setEmployees(emp);
        setData(rows);
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Gagal memuat data reset password.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) => {
      const emp = employeeMap.get(r.employeeCode);
      const name = emp ? `${emp.firstName} ${emp.lastName || ""}`.toLowerCase() : r.employeeCode.toLowerCase();
      const matchSearch = !q || name.includes(q) || r.employeeCode.toLowerCase().includes(q) || String(r.id).includes(q);
      const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter, employeeMap]);

  const stats = useMemo(() => {
    const c = { total: data.length, pending: 0, approved: 0, rejected: 0 };
    data.forEach((r) => {
      const s = r.status.toLowerCase();
      if (s === "pending") c.pending++;
      else if (s === "approved" || s === "accepted") c.approved++;
      else if (s === "rejected") c.rejected++;
    });
    return c;
  }, [data]);

  const pendingItems = useMemo(
    () => filtered.filter((r) => r.status.toLowerCase() === "pending"),
    [filtered]
  );

  // Auto ACC langsung untuk reset password: { requestId, status: "approved" }
  const handleAutoAcc = async (id: number) => {
    setProcessingId(id);
    try {
      await reviewResetPassword(id, "approved");
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui reset password.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm(`Tolak permintaan reset password #${id}?`)) return;
    setProcessingId(id);
    try {
      await reviewResetPassword(id, "rejected");
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menolak reset password.");
    } finally {
      setProcessingId(null);
    }
  };

  // Auto ACC Semua reset password pending
  const handleAutoAccAll = async () => {
    if (pendingItems.length === 0) return;
    setIsBulkApproving(true);
    let successCount = 0;
    for (const item of pendingItems) {
      try {
        await reviewResetPassword(item.id, "approved");
        setData((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: "approved" } : r)));
        successCount++;
      } catch (e) {
        console.error(`Gagal approve requestId ${item.id}:`, e);
      }
    }
    setIsBulkApproving(false);
    alert(`Berhasil Auto ACC ${successCount} dari ${pendingItems.length} permintaan reset password.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Permintaan Reset Password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tinjau dan verifikasi permintaan reset kata sandi karyawan.
          </p>
        </div>
        {pendingItems.length > 0 && (
          <Button
            onClick={handleAutoAccAll}
            disabled={isBulkApproving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2"
          >
            {isBulkApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Auto ACC Semua ({pendingItems.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Permintaan</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600 tabular-nums">{stats.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 tabular-nums">{stats.approved}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Rejected</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600 tabular-nums">{stats.rejected}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau ID karyawan..."
            className="pl-9 h-10 rounded-lg border-slate-300"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-48 h-10 rounded-lg border-slate-300">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadData} variant="outline" className="h-10 rounded-lg">
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Waktu Permintaan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  </TableCell>
                </TableRow>
              ) : errorMsg ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <p className="text-rose-600 font-medium">{errorMsg}</p>
                    <Button onClick={loadData} variant="outline" size="sm" className="mt-3">
                      Coba Lagi
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                    Tidak ada permintaan reset password.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const emp = employeeMap.get(row.employeeCode);
                  const name = emp ? `${emp.firstName} ${emp.lastName || ""}`.trim() : row.employeeCode;
                  const isPending = row.status.toLowerCase() === "pending";
                  const isBusy = processingId === row.id;

                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50 h-12">
                      <TableCell className="font-medium text-slate-900">{row.id}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{name}</div>
                        <div className="text-xs text-slate-500">{row.employeeCode}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 tabular-nums">{formatDate(row.date)}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDetailRow(row);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
                                disabled={isBusy || isBulkApproving}
                                onClick={() => handleAutoAcc(row.id)}
                                title="Auto ACC Reset Password"
                              >
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Auto ACC
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isBusy || isBulkApproving}
                                onClick={() => handleReject(row.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Tolak
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-xl border-slate-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
              Detail Permintaan Reset Password
            </DialogTitle>
          </DialogHeader>
          {detailRow && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Request ID</span>
                <span className="font-medium text-slate-900">{detailRow.id}</span>
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
                <span className="font-medium text-slate-900">{detailRow.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900">
                  {employeeMap.get(detailRow.employeeCode)?.email || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Permintaan</span>
                <span className="font-medium text-slate-900">{formatDate(detailRow.date)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Status</span>
                <Badge className={statusBadgeClass(detailRow.status)}>{detailRow.status}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
