"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Coins,
  Plus,
  Pencil,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

type PayrollComponent = {
  id: number;
  componentName: string;
  description: string | null;
  type: "earning" | "deduction";
  createdAt?: string;
};

export default function PayrollComponentsPage() {
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "earning" | "deduction">("all");

  // Modal dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
  const [formData, setFormData] = useState({
    componentName: "",
    type: "earning" as "earning" | "deduction",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch components from backend
  const fetchComponents = useCallback(async () => {
    try {
      const res = await apiFetch("/finance/components");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setComponents(result.data);
      } else {
        setToastMessage({ type: "error", text: result.message || "Gagal memuat komponen gaji" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setToastMessage({ type: "error", text: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComponents();
  }, [fetchComponents]);

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingComponent(null);
    setFormData({
      componentName: "",
      type: "earning",
      description: "",
    });
    setDialogError("");
    setIsDialogOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (comp: PayrollComponent) => {
    setEditingComponent(comp);
    setFormData({
      componentName: comp.componentName,
      type: comp.type,
      description: comp.description || "",
    });
    setDialogError("");
    setIsDialogOpen(true);
  };

  // Submit Form (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError("");

    if (!formData.componentName.trim() || formData.componentName.trim().length < 3) {
      setDialogError("Nama komponen minimal 3 karakter");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingComponent) {
        // UPDATE: PATCH /finance/components/:id
        const res = await apiFetch(`/finance/components/${editingComponent.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            componentName: formData.componentName.trim(),
            type: formData.type,
            description: formData.description.trim() || null,
          }),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Gagal memperbarui komponen");
        }
        setToastMessage({ type: "success", text: "Komponen gaji berhasil diperbarui" });
      } else {
        // CREATE: POST /finance/components
        const res = await apiFetch("/finance/components", {
          method: "POST",
          body: JSON.stringify({
            componentName: formData.componentName.trim(),
            type: formData.type,
            description: formData.description.trim() || null,
          }),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Gagal menambahkan komponen");
        }
        setToastMessage({ type: "success", text: "Komponen gaji baru berhasil ditambahkan" });
      }

      setIsDialogOpen(false);
      fetchComponents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalCount = components.length;
  const earningCount = components.filter((c) => c.type === "earning").length;
  const deductionCount = components.filter((c) => c.type === "deduction").length;

  // Filtered components
  const filteredComponents = useMemo(() => {
    return components.filter((item) => {
      const matchQuery =
        item.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === "all" || item.type === typeFilter;
      return matchQuery && matchType;
    });
  }, [components, searchQuery, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight flex items-center gap-2.5">
            <Coins className="h-7 w-7 text-emerald-600" />
            Manajemen Komponen Gaji
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi komponen pendapatan (tunjangan, insentif) dan potongan gaji karyawan.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-4 text-sm font-medium gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Komponen
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Komponen</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Komponen Pendapatan</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{earningCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Komponen Potongan</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{deductionCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama komponen atau deskripsi..."
            className="pl-9 h-10 rounded-xl bg-slate-50/70 border-slate-200 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600 w-full sm:w-auto">
            <button
              onClick={() => setTypeFilter("all")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-colors ${
                typeFilter === "all" ? "bg-white text-slate-900 shadow-xs font-semibold" : "hover:text-slate-900"
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setTypeFilter("earning")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-colors ${
                typeFilter === "earning" ? "bg-white text-emerald-700 shadow-xs font-semibold" : "hover:text-slate-900"
              }`}
            >
              Pendapatan ({earningCount})
            </button>
            <button
              onClick={() => setTypeFilter("deduction")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-colors ${
                typeFilter === "deduction" ? "bg-white text-rose-700 shadow-xs font-semibold" : "hover:text-slate-900"
              }`}
            >
              Potongan ({deductionCount})
            </button>
          </div>
        </div>
      </div>

      {/* Components Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat data komponen gaji...</p>
          </div>
        ) : filteredComponents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Coins className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-base font-semibold text-slate-700">Tidak ada komponen ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || typeFilter !== "all"
                ? "Coba sesuaikan kata kunci pencarian atau filter tipe."
                : "Belum ada komponen gaji yang ditambahkan. Buat komponen baru sekarang."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="w-16 font-semibold text-slate-700">ID</TableHead>
                <TableHead className="font-semibold text-slate-700">Nama Komponen</TableHead>
                <TableHead className="font-semibold text-slate-700">Tipe</TableHead>
                <TableHead className="font-semibold text-slate-700">Deskripsi</TableHead>
                <TableHead className="w-24 text-right font-semibold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComponents.map((item) => (
                <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500 font-medium">
                    #{item.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {item.componentName}
                  </TableCell>
                  <TableCell>
                    {item.type === "earning" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium gap-1 hover:bg-emerald-100">
                        <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        Pendapatan
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-medium gap-1 hover:bg-rose-100">
                        <ArrowDownRight className="w-3 h-3 text-rose-600" />
                        Potongan
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm max-w-md truncate">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-8 px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-medium gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Modal: Create / Update Component */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 font-heading">
              {editingComponent ? "Edit Komponen Gaji" : "Tambah Komponen Gaji Baru"}
            </DialogTitle>
            <p className="text-xs text-slate-500">
              {editingComponent
                ? "Perbarui parameter komponen gaji yang sudah ada."
                : "Definisikan komponen penghasilan baru untuk dialokasikan ke karyawan."}
            </p>
          </DialogHeader>

          {dialogError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{dialogError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Nama Komponen <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                value={formData.componentName}
                onChange={(e) => setFormData({ ...formData, componentName: e.target.value })}
                placeholder="Contoh: Gaji Pokok, Tunjangan Transport, BPJS"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Tipe Komponen <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) => {
                  if (val === "earning" || val === "deduction") {
                    setFormData({ ...formData, type: val });
                  }
                }}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earning">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Pendapatan (Earning / Tunjangan)
                    </span>
                  </SelectItem>
                  <SelectItem value="deduction">
                    <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      Potongan (Deduction / Iuran)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Deskripsi (Opsional)
              </Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Penjelasan aturan atau keterangan komponen..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl h-10 px-4 text-xs font-medium"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 text-xs font-medium gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingComponent ? "Simpan Perubahan" : "Buat Komponen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
