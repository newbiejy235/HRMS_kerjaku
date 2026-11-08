"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Attendance = {
  shiftId: number;
  shiftDate: string;
  employeeIn: string | null;
  employeeOut: string | null;
  employeeLocate: string | null;
  status: string | null;
  id_employee: string;
};

type Employee = {
  employeeId: string;
  firstName: string;
  lastName: string | null;
  employmentStatus: string;
};

const formatTime = (time: string | null) => {
  if (!time) return "-";
  return time.slice(0, 5);
};

const getTodayJakarta = () => {
  const now = new Date();
  const jakarta = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return jakarta.toISOString().split("T")[0];
};

const formatDateIndonesian = () => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function HRDashboardPage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, empRes] = await Promise.all([
          apiFetch("/manage/attendance"),
          apiFetch("/data"),
        ]);

        const attData = await attRes.json();
        const empData = await empRes.json();

        if (attData.success) {
          setAttendance(attData.data.data || []);
        }
        if (empData.success) {
          setEmployees(empData.data || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const today = getTodayJakarta();
  const todayAttendance = attendance.filter((a) => a.shiftDate === today);

  const totalKaryawanAktif = employees.filter(
    (e) => e.employmentStatus === "active"
  ).length;
  const totalHadir = todayAttendance.filter(
    (a) => a.employeeIn !== null
  ).length;
  const totalTerlambat = todayAttendance.filter(
    (a) => a.status === "late"
  ).length;
  const totalBelumAbsen = Math.max(0, totalKaryawanAktif - totalHadir);

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return employeeId;
    return `${emp.firstName} ${emp.lastName || ""}`.trim();
  };

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
        <h1 className="text-2xl font-semibold text-slate-900 font-heading">
          Dashboard HR
        </h1>
        <p className="text-sm text-slate-500 mt-1">{formatDateIndonesian()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm rounded-xl border-border">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Hadir Hari Ini</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                {totalHadir}
              </span>
              <span className="text-sm text-slate-500">
                / {totalKaryawanAktif} karyawan
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm rounded-xl border-border">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Terlambat</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-amber-600 tabular-nums">
                {totalTerlambat}
              </span>
              <span className="text-sm text-slate-500">karyawan</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm rounded-xl border-border">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Belum Absen</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-rose-600 tabular-nums">
                {totalBelumAbsen}
              </span>
              <span className="text-sm text-slate-500">karyawan</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm rounded-xl border-border">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Total Karyawan</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                {totalKaryawanAktif}
              </span>
              <span className="text-sm text-slate-500">aktif</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm rounded-xl border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">
            Kehadiran Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Nama Karyawan</th>
                  <th className="px-6 py-3 font-medium">Jam Masuk</th>
                  <th className="px-6 py-3 font-medium">Jam Pulang</th>
                  <th className="px-6 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todayAttendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Belum ada data kehadiran hari ini.
                    </td>
                  </tr>
                ) : (
                  todayAttendance.map((row) => (
                    <tr
                      key={row.shiftId}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {getEmployeeName(row.id_employee)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 tabular-nums">
                        {formatTime(row.employeeIn)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 tabular-nums">
                        {formatTime(row.employeeOut)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge
                          variant="outline"
                          className={
                            row.status === "on time"
                              ? "bg-green-50 text-green-700 border-green-200 gap-1.5"
                              : row.status === "late"
                              ? "bg-amber-50 text-amber-700 border-amber-200 gap-1.5"
                              : row.status === "tolerance time"
                              ? "bg-slate-100 text-slate-600 border-slate-200 gap-1.5"
                              : "bg-rose-50 text-rose-700 border-rose-200 gap-1.5"
                          }
                        >
                          {row.status === "on time" && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          {row.status === "late" && (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {row.status !== "on time" &&
                            row.status !== "late" &&
                            row.status !== "tolerance time" && (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                          {row.status === "on time"
                            ? "Tepat Waktu"
                            : row.status === "late"
                            ? "Terlambat"
                            : row.status === "tolerance time"
                            ? "Toleransi"
                            : row.status || "-"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}