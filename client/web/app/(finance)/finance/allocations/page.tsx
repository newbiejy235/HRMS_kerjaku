"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

type Allocation = {
  allocationId: number;
  employeeId: string;
  employeeName: string;
  componentId: number;
  componentName: string;
  amount: string;
  type: string;
};

type Employee = { employeeId: string; firstName: string; lastName: string | null };
type Component = { id: number; componentName: string; type: string };

const formatRupiah = (angka: string | number) => {
  const num = typeof angka === "string" ? parseFloat(angka) : angka;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
};

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    employeeId: "",
    componentId: "",
    amount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [allocRes, empRes, compRes] = await Promise.all([
        apiFetch("/finance/allocations"),
        apiFetch("/data"),
        apiFetch("/finance/components"),
      ]);
      
      const allocData = await allocRes.json();
      const empData = await empRes.json();
      const compData = await compRes.json();

      if (allocData.success) setAllocations(allocData.data);
      if (empData.success) setEmployees(empData.data);
      if (compData.success) setComponents(compData.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/finance/allocations", {
        method: "POST",
        body: JSON.stringify({
          employeeId: formData.employeeId,
          componentId: Number(formData.componentId),
          amount: Number(formData.amount),
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setIsDialogOpen(false);
        setFormData({ employeeId: "", componentId: "", amount: "" });
        fetchData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Gagal menyimpan alokasi:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Pengalokasian Gaji
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tentukan besaran komponen gaji untuk setiap karyawan.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Alokasi
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] p-6 rounded-xl border-slate-200">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
                Alokasikan Komponen
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Karyawan</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-300">
                    <SelectValue placeholder="Pilih Karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Komponen Gaji</Label>
                <Select
                  value={formData.componentId}
                  onValueChange={(value) => setFormData({ ...formData, componentId: value })}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-300">
                    <SelectValue placeholder="Pilih Komponen" />
                  </SelectTrigger>
                  <SelectContent>
                    {components.map((comp) => (
                      <SelectItem key={comp.id} value={String(comp.id)}>
                        {comp.componentName} ({comp.type === "earning" ? "Pendapatan" : "Potongan"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-sm font-medium text-slate-700">Nominal (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Contoh: 5000000"
                  className="h-10 rounded-lg border-slate-300 tabular-nums"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 rounded-lg border-slate-300">
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Nama Karyawan</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Komponen</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-right">Nominal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                </TableCell>
              </TableRow>
            ) : allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                  Belum ada data alokasi gaji.
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((row) => (
                <TableRow key={row.allocationId} className="border-slate-200 hover:bg-slate-50 transition-colors h-12">
                  <TableCell className="text-sm font-medium text-slate-900">{row.employeeName}</TableCell>
                  <TableCell className="text-sm text-slate-600">{row.componentName}</TableCell>
                  <TableCell className={`text-sm font-semibold tabular-nums text-right ${row.type === "deduction" ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatRupiah(row.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}