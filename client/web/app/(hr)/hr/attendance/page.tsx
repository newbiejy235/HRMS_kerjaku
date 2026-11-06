"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Attendance = {
  shiftId: number;
  shiftDate: string;
  employeeIn: string | null;
  employeeOut: string | null;
  employeeLocate: string | null;
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
      } catch (error) {
        setErrorMsg("Tidak dapat terhubung ke server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">Kehadiran Karyawan</h1>
        <p className="text-sm text-slate-500 mt-1">Pantau riwayat absensi masuk dan pulang karyawan.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">ID Karyawan</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium text-center">Jam Masuk</th>
                <th className="px-6 py-3 font-medium text-center">Jam Pulang</th>
                <th className="px-6 py-3 font-medium">Lokasi</th>
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
                  <td colSpan={5} className="px-6 py-12 text-center text-rose-600">
                    {errorMsg}
                  </td>
                </tr>
              ) : attendanceData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data kehadiran.
                  </td>
                </tr>
              ) : (
                attendanceData.map((row) => (
                  <tr key={row.shiftId} className="hover:bg-slate-50 transition-colors h-12">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.id_employee}</td>
                    <td className="px-6 py-4 text-slate-600 tabular-nums">{formatDate(row.shiftDate)}</td>
                    <td className="px-6 py-4 text-slate-600 tabular-nums text-center">{formatTime(row.employeeIn)}</td>
                    <td className="px-6 py-4 text-slate-600 tabular-nums text-center">{formatTime(row.employeeOut)}</td>
                    <td className="px-6 py-4 text-slate-600">{row.employeeLocate || "-"}</td>
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