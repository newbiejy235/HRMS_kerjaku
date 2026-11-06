import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Tambahkan ikon untuk status
import { CheckCircle2, Clock, XCircle, MinusCircle } from "lucide-react";

const kehadiranHariIni = [
  { id: 1, nama: "Budi Santoso", shift: "Pagi (07.00 - 15.00)", status: "Hadir", jam: "06.55" },
  { id: 2, nama: "Siti Aminah", shift: "Pagi (07.00 - 15.00)", status: "Terlambat", jam: "07.12" },
  { id: 3, nama: "Andi Wijaya", shift: "Siang (14.00 - 22.00)", status: "Belum Absen", jam: "-" },
  { id: 4, nama: "Dewi Lestari", shift: "Pagi (07.00 - 15.00)", status: "Izin", jam: "-" },
];

export default function HRDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 font-heading">Dashboard HR</h1>
        <p className="text-sm text-slate-500 mt-1">Senin, 3 November 2026</p>
      </div>

      {/* Ringkasan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm rounded-xl border-border">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Hadir Hari Ini</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums">42</span>
              <span className="text-sm text-slate-500">/ 48 karyawan</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm rounded-xl border-border">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Terlambat</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-amber-600 tabular-nums">5</span>
              <span className="text-sm text-slate-500">karyawan</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm rounded-xl border-border">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Izin / Sakit</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums">3</span>
              <span className="text-sm text-slate-500">pengajuan</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm rounded-xl border-border border-l-4 border-l-orange-500">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Total Lembur Minggu Ini</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums">18,5</span>
              <span className="text-sm text-slate-500">jam</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Kehadiran */}
      <Card className="shadow-sm rounded-xl border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">Kehadiran Shift Pagi & Siang</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Nama Karyawan</th>
                  <th className="px-6 py-3 font-medium">Shift</th>
                  <th className="px-6 py-3 font-medium">Jam Masuk</th>
                  <th className="px-6 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kehadiranHariIni.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.nama}</td>
                    <td className="px-6 py-4 text-slate-600">{row.shift}</td>
                    <td className="px-6 py-4 text-slate-600 tabular-nums">{row.jam}</td>
                    <td className="px-6 py-4 text-right">
                      {/* LOGIKA BADGE BARU: Warna + Ikon */}
                      <Badge 
                        variant="outline" 
                        className={
                          row.status === "Hadir" 
                            ? "bg-green-50 text-green-700 border-green-200 gap-1.5" // Success = Green, soft fill
                            : row.status === "Terlambat" 
                            ? "bg-amber-50 text-amber-700 border-amber-200 gap-1.5" 
                            : row.status === "Izin" 
                            ? "bg-slate-100 text-slate-600 border-slate-200 gap-1.5" 
                            : "bg-rose-50 text-rose-700 border-rose-200 gap-1.5"
                        }
                      >
                        {row.status === "Hadir" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {row.status === "Terlambat" && <Clock className="h-3.5 w-3.5" />}
                        {row.status === "Izin" && <MinusCircle className="h-3.5 w-3.5" />}
                        {row.status === "Belum Absen" && <XCircle className="h-3.5 w-3.5" />}
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}