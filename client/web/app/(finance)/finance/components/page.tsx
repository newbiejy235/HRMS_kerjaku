"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type Component = {
  id: number;
  componentName: string;
  description: string | null;
  type: "earning" | "deduction";
};

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    componentName: "",
    type: "earning",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComponents = async () => {
    try {
      const response = await apiFetch("/finance/components");
      const result = await response.json();
      if (result.success) setComponents(result.data);
    } catch (error) {
      console.error("Gagal mengambil data komponen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/finance/components", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      
      if (result.success) {
        setIsDialogOpen(false);
        setFormData({ componentName: "", type: "earning", description: "" });
        fetchComponents();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Gagal menyimpan komponen:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Komponen Gaji
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Master data pendapatan dan potongan gaji.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Komponen
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] p-6 rounded-xl border-slate-200">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
                Tambah Komponen Gaji
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Nama Komponen</Label>
                <Input
                  id="name"
                  required
                  value={formData.componentName}
                  onChange={(e) => setFormData({ ...formData, componentName: e.target.value })}
                  placeholder="Contoh: Gaji Pokok"
                  className="h-10 rounded-lg border-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-sm font-medium text-slate-700">Tipe</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as "earning" | "deduction" })}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-300">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Pendapatan (Earning)</SelectItem>
                    <SelectItem value="deduction">Potongan (Deduction)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-sm font-medium text-slate-700">Deskripsi (Opsional)</Label>
                <Input
                  id="desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan tambahan"
                  className="h-10 rounded-lg border-slate-300"
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
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Nama Komponen</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Tipe</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Deskripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                </TableCell>
              </TableRow>
            ) : components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                  Belum ada data komponen gaji.
                </TableCell>
              </TableRow>
            ) : (
              components.map((row) => (
                <TableRow key={row.id} className="border-slate-200 hover:bg-slate-50 transition-colors h-12">
                  <TableCell className="text-sm font-medium text-slate-900">{row.componentName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      row.type === "earning" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }>
                      {row.type === "earning" ? "Pendapatan" : "Potongan"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{row.description || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}