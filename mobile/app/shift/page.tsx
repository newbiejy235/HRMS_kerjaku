"use client";

import { useEffect, useState } from "react";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import { CalendarDays, Clock, MapPin, AlertTriangle } from "lucide-react";
import { dashboardService, ShiftScheduleItem } from "../../lib/services/dashboardService";

export default function ShiftPage() {
  const [shifts, setShifts] = useState<ShiftScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await dashboardService.getShiftSchedule();
      setShifts(data);
    } catch {
      setErrorMsg("Data jadwal shift belum bisa dimuat");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PlaceholderLayout title="Jadwal Shift" subtitle="Jadwal kerja dan rincian shift outlet" badge="Shift Kerja">
        <div className="flex-1 flex flex-col justify-center items-center space-y-3 p-6">
          <div className="h-4 bg-neutral-200/60 rounded-full w-24 animate-pulse" />
          <div className="h-4 bg-neutral-200/60 rounded-full w-40 animate-pulse" />
          <div className="h-4 bg-neutral-200/60 rounded-full w-48 animate-pulse" />
        </div>
      </PlaceholderLayout>
    );
  }

  if (errorMsg && shifts.length === 0) {
    return (
      <PlaceholderLayout title="Jadwal Shift" subtitle="Jadwal kerja dan rincian shift outlet" badge="Shift Kerja">
        <div className="flex-1 flex flex-col justify-center items-center space-y-3 text-center p-6">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-neutral-200 flex items-center justify-center mx-auto">
            <CalendarDays className="w-5 h-5 text-neutral-600" />
          </div>
          <h2 className="text-base font-extrabold text-neutral-900">{errorMsg}</h2>
          <button
            type="button"
            onClick={loadShifts}
            className="py-2.5 px-5 rounded-full bg-neutral-900 text-white font-bold text-sm border-2 border-neutral-900 active:scale-[0.98]"
          >
            Coba lagi
          </button>
        </div>
      </PlaceholderLayout>
    );
  }

  return (
    <PlaceholderLayout title="Jadwal Shift" subtitle="Jadwal kerja dan rincian shift outlet" badge="Shift Kerja">
      <div className="flex-1 flex flex-col space-y-4">
        {shifts.length === 0 ? (
          <div className="bg-white border-2 border-neutral-900 rounded-3xl p-6 text-center shadow-[2px_2px_0px_0px_#171717]">
            <AlertTriangle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <h2 className="text-base font-extrabold text-neutral-900">Belum ada jadwal shift</h2>
            <p className="text-xs text-neutral-600 mt-1">
              Jadwal shift akan muncul di sini setelah ditetapkan oleh HR outlet.
            </p>
          </div>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.shiftId}
              className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[2px_2px_0px_0px_#171717]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-white flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-neutral-900">
                      {shift.category === "Morning" ? "Shift Pagi" : shift.category === "Afternoon" ? "Shift Siang" : "Shift Malam"}
                    </h2>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      {new Date(shift.shiftDate).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_#171717]">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Waktu Mulai
                    </p>
                    <p className="text-base font-black text-neutral-900">
                      {shift.normal_time_in}
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-neutral-900 shrink-0" />
                </div>
                <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_#171717]">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Waktu Selesai
                    </p>
                    <p className="text-base font-black text-neutral-900">
                      {shift.normal_time_out}
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-neutral-900 shrink-0" />
                </div>
                <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_#171717]">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Outlet Tempat Tugas
                    </p>
                    <p className="text-base font-black text-neutral-900 truncate">
                      {shift.employeeLocate || "Outlet Kemang"}
                    </p>
                  </div>
                  <MapPin className="w-5 h-5 text-neutral-900 shrink-0" />
                </div>
              </div>
            </div>
          ))
        )}

        <div className="p-4 bg-[#F4EFE6] border-2 border-neutral-900 rounded-2xl text-[11px] text-neutral-700 leading-relaxed">
          <p className="font-bold text-neutral-900 mb-1">
            Jadwal terbaru akan muncul di sini
          </p>
          Halaman ini menampilkan jadwal shift mingguan dan keterangan
          tambahan dari supervisor. Data di atas diambil dari sistem HR melalui API.
        </div>
      </div>
    </PlaceholderLayout>
  );
}
