"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Clock, AlertCircle, Loader2 } from "lucide-react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ShiftCategory = "Morning" | "Afternoon" | "Evening";

interface Shift {
  id_settings: number;
  category: ShiftCategory;
  normal_time_in: string;
  normal_time_out: string;
  tolerance_time: string | null;
}

const categoryLabels: Record<ShiftCategory, string> = {
  Morning: "Pagi",
  Afternoon: "Siang",
  Evening: "Malam",
};

const initialForm = {
  category: "" as ShiftCategory | "",
  normal_time_in: "",
  normal_time_out: "",
  tolerance_time: "",
};

export default function ShiftPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // GET seluruh shift settings
  const fetchShiftSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/manage/shift-settings/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data shift");
      }

      setShifts(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchShiftSettings();
    };

    loadData();
  }, [fetchShiftSettings]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFormValid =
    formData.category !== "" &&
    formData.normal_time_in !== "" &&
    formData.normal_time_out !== "" &&
    formData.tolerance_time !== "";

  // POST shift settings
  const handleCreateShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      const token = getToken();

      const payload = {
        category: formData.category,
        normal_time_in: `${formData.normal_time_in}:00`,
        normal_time_out: `${formData.normal_time_out}:00`,
        tolerance_time: `${formData.tolerance_time}:00`,
      };

      const response = await fetch(`${API_URL}/manage/shift-settings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal membuat shift");
      }

      // Refresh data setelah berhasil membuat shift
      await fetchShiftSettings();

      setFormData(initialForm);
      setIsDialogOpen(false);

      alert("Shift berhasil dibuat");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Kelola Shift
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur jam kerja dan toleransi keterlambatan.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-10 px-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Shift Baru
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead>Nama Shift</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Pulang</TableHead>
                <TableHead className="text-center">Batas Toleransi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                    <p className="text-sm text-slate-500 mt-2">
                      Memuat data shift...
                    </p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-red-500"
                  >
                    {error}
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={fetchShiftSettings}
                      >
                        Coba Lagi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-slate-500"
                  >
                    Belum ada data shift.
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((row) => (
                  <TableRow
                    key={row.id_settings}
                    className="border-slate-200 hover:bg-slate-50 h-12"
                  >
                    <TableCell className="text-sm font-medium text-slate-900">
                      {categoryLabels[row.category] ?? row.category}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {row.normal_time_in?.slice(0, 5)}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {row.normal_time_out?.slice(0, 5)}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-slate-600 text-center">
                      {row.tolerance_time?.slice(0, 5) ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-xl border-slate-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
              Buat Master Shift
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateShift} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Nama Shift</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                required
              >
                <option value="">Pilih shift</option>
                <option value="Morning">Pagi</option>
                <option value="Afternoon">Siang</option>
                <option value="Evening">Malam</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="normal_time_in">Jam Mulai</Label>
                <Input
                  id="normal_time_in"
                  name="normal_time_in"
                  type="time"
                  value={formData.normal_time_in}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="normal_time_out">Jam Selesai</Label>
                <Input
                  id="normal_time_out"
                  name="normal_time_out"
                  type="time"
                  value={formData.normal_time_out}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Isi batas waktu toleransi sesuai kebijakan perusahaan.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tolerance_time">Batas Waktu Toleransi</Label>
                <Input
                  id="tolerance_time"
                  name="tolerance_time"
                  type="time"
                  value={formData.tolerance_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormData(initialForm);
                }}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={!isFormValid || submitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Shift"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
