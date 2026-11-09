"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, QrCode } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Attendance = {
  shiftId: number;
  shiftDate: string;
  employeeIn: string | null;
  employeeOut: string | null;
  employeeLocate: string | null;
  status: string;
  id_employee: string;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (timeString: string | null) => {
  if (!timeString) return "-";
  return timeString.slice(0, 5);
};

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await apiFetch("/manage/attendance");
        const result = await response.json();

        if (result.success) {
          setAttendanceData(result.data.data || []);
        } else {
          setErrorMsg(result.message || "Gagal mengambil data kehadiran.");
        }
      } catch {
        setErrorMsg("Tidak dapat terhubung ke server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Kehadiran Karyawan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau riwayat absensi masuk dan pulang karyawan.
          </p>
        </div>

        <Link href="/attendance/qr/generate">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-4 text-sm font-medium gap-2">
            <QrCode className="w-4 h-4" />
            Buka Kiosk QR Tablet
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">ID Karyawan</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium text-center">Jam Masuk</th>
                <th className="px-6 py-3 font-medium text-center">
                  Jam Pulang
                </th>
                <th className="px-6 py-3 font-medium">Lokasi</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    Memuat data kehadiran...
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-rose-500">
                    {errorMsg}
                  </td>
                </tr>
              ) : attendanceData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Belum ada data kehadiran.
                  </td>
                </tr>
              ) : (
                attendanceData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.id_employee}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(item.shiftDate)}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {formatTime(item.employeeIn)}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {formatTime(item.employeeOut)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.employeeLocate || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "present"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status === "late"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.status === "present"
                          ? "Hadir"
                          : item.status === "late"
                          ? "Terlambat"
                          : "Tidak Hadir"}
                      </span>
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
