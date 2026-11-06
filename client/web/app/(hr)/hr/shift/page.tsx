"use client";

import { useState } from "react";
import { Plus, Clock, AlertCircle } from "lucide-react";
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

const dummyShift = [
  { id: 1, nama: "Pagi", mulai: "07:00", selesai: "15:00", toleransi: 10, alpha: 30 },
  { id: 2, nama: "Siang", mulai: "14:00", selesai: "22:00", toleransi: 15, alpha: 45 },
  { id: 3, nama: "Malam", mulai: "22:00", selesai: "06:00", toleransi: 10, alpha: 30 },
];

export default function ShiftPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nama: "",
    mulai: "",
    selesai: "",
    toleransi: "",
    alpha: ""
  });

  const isFormValid = 
    formData.nama.trim() !== "" &&
    formData.mulai !== "" &&
    formData.selesai !== "" &&
    formData.toleransi !== "" &&
    formData.alpha !== "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">Kelola Shift</h1>
          <p className="text-sm text-slate-500 mt-1">Atur jam kerja, toleransi keterlambatan, dan batas Alpha.</p>
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
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Nama Shift</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Jam Masuk</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Jam Pulang</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-center">Toleransi Telat</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-center">Batas Alpha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyShift.map((row) => (
                <TableRow key={row.id} className="border-slate-200 hover:bg-slate-50 transition-colors h-12">
                  <TableCell className="text-sm font-medium text-slate-900">{row.nama}</TableCell>
                  <TableCell className="text-sm text-slate-600 tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {row.mulai}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {row.selesai}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 tabular-nums text-center">{row.toleransi} menit</TableCell>
                  <TableCell className="text-sm text-slate-600 tabular-nums text-center">{row.alpha} menit</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-xl border-slate-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">Buat Master Shift</DialogTitle>
          </DialogHeader>
          
          <form className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama" className="text-sm font-medium text-slate-700">Nama Shift</Label>
              <Input id="nama" value={formData.nama} onChange={handleInputChange} placeholder="Cth: Shift Pagi" className="h-10 rounded-lg border-slate-300" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mulai" className="text-sm font-medium text-slate-700">Jam Mulai</Label>
                <Input id="mulai" type="time" value={formData.mulai} onChange={handleInputChange} className="h-10 rounded-lg border-slate-300 tabular-nums" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="selesai" className="text-sm font-medium text-slate-700">Jam Selesai</Label>
                <Input id="selesai" type="time" value={formData.selesai} onChange={handleInputChange} className="h-10 rounded-lg border-slate-300 tabular-nums" />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4 mt-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Sesuai kebijakan perusahaan, Anda <strong>wajib</strong> mengisi batas toleransi dan batas Alpha. Sistem tidak memiliki nilai bawaan.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="toleransi" className="text-sm font-medium text-slate-700">Toleransi Telat (menit)</Label>
                  <Input id="toleransi" type="number" value={formData.toleransi} onChange={handleInputChange} placeholder="Cth: 10" className="h-10 rounded-lg border-slate-300 tabular-nums bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="alpha" className="text-sm font-medium text-slate-700">Batas Alpha (menit)</Label>
                  <Input id="alpha" type="number" value={formData.alpha} onChange={handleInputChange} placeholder="Cth: 30" className="h-10 rounded-lg border-slate-300 tabular-nums bg-white" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 rounded-lg border-slate-300">
                Batal
              </Button>
              <Button 
                type="button" 
                disabled={!isFormValid}
                onClick={() => setIsDialogOpen(false)} 
                className="h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
              >
                Simpan Shift
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}