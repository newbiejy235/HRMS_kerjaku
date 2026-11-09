"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

type Karyawan = {
  employeeId: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  noTelp: string | null;
  hireDate: string;
  employmentStatus: string;
  email: string;
  role: string;
};

type FormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "L" | "P" | "";
  noTelp: string;
  cities_id: string;
  noRek: string;
  nip: string;
  NPWP: string;
  BPJS_Kesehatan: string;
  BPJS_Ketenagakerjaan: string;
  hire_date: string;
  resign_date: string;
  idPosition: string;
  idDepartment: string;
  employment_status: "active" | "fired";
};

const emptyForm: FormData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  gender: "",
  noTelp: "",
  cities_id: "",
  noRek: "",
  nip: "",
  NPWP: "",
  BPJS_Kesehatan: "",
  BPJS_Ketenagakerjaan: "",
  hire_date: "",
  resign_date: "",
  idPosition: "",
  idDepartment: "",
  employment_status: "active",
};

export default function KaryawanPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Karyawan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await apiFetch("/data");
        const result = await response.json();
        if (active && result.success) setKaryawan(result.data);
      } catch (error) {
        console.error("Gagal mengambil data karyawan:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshKaryawan = async () => {
    try {
      const response = await apiFetch("/data");
      const result = await response.json();
      if (result.success) setKaryawan(result.data);
    } catch (error) {
      console.error("Gagal mengambil data karyawan:", error);
    }
  };

  const filteredKaryawan = karyawan.filter((k) =>
    k.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.employeeId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        gender: formData.gender,
        noTelp: formData.noTelp,
        cities_id: Number(formData.cities_id),
        noRek: formData.noRek,
        nip: formData.nip,
        hire_date: formData.hire_date,
        idPosition: Number(formData.idPosition),
        idDepartment: Number(formData.idDepartment),
        employment_status: formData.employment_status,
      };
      if (formData.lastName) body.lastName = formData.lastName;
      if (formData.NPWP) body.NPWP = formData.NPWP;
      if (formData.BPJS_Kesehatan) body.BPJS_Kesehatan = formData.BPJS_Kesehatan;
      if (formData.BPJS_Ketenagakerjaan) body.BPJS_Ketenagakerjaan = formData.BPJS_Ketenagakerjaan;
      if (formData.resign_date) body.resign_date = formData.resign_date;

      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.success) {
        setIsAddOpen(false);
        setFormData(emptyForm);
        refreshKaryawan();
      } else {
        alert(result.message || "Gagal menambahkan karyawan");
      }
    } catch (error) {
      console.error("Gagal menyimpan karyawan:", error);
      alert("Gagal menyimpan karyawan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (row: Karyawan) => {
    setSelected(row);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">Kelola Karyawan</h1>
          <p className="text-sm text-slate-500 mt-1">Manajemen data, kontrak, dan status karyawan.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Karyawan
            </Button>
          } />
          <DialogContent className="sm:max-w-[700px] p-6 rounded-xl border-slate-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">Tambah Karyawan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <Input id="password" type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">Nama Depan</Label>
                  <Input id="firstName" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Nama Belakang</Label>
                  <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: (v || "") as FormData["gender"] })}>
                    <SelectTrigger className="h-10 rounded-lg border-slate-300"><SelectValue placeholder="Pilih Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki (L)</SelectItem>
                      <SelectItem value="P">Perempuan (P)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="noTelp" className="text-sm font-medium text-slate-700">No Telepon</Label>
                  <Input id="noTelp" required minLength={10} maxLength={13} value={formData.noTelp} onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cities_id" className="text-sm font-medium text-slate-700">City ID</Label>
                  <Input id="cities_id" type="number" required min={1} value={formData.cities_id} onChange={(e) => setFormData({ ...formData, cities_id: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="noRek" className="text-sm font-medium text-slate-700">No Rekening</Label>
                  <Input id="noRek" required minLength={10} maxLength={100} value={formData.noRek} onChange={(e) => setFormData({ ...formData, noRek: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nip" className="text-sm font-medium text-slate-700">NIP</Label>
                  <Input id="nip" required minLength={10} maxLength={100} value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="NPWP" className="text-sm font-medium text-slate-700">NPWP</Label>
                  <Input id="NPWP" maxLength={16} value={formData.NPWP} onChange={(e) => setFormData({ ...formData, NPWP: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="BPJS_Kesehatan" className="text-sm font-medium text-slate-700">BPJS Kesehatan</Label>
                  <Input id="BPJS_Kesehatan" maxLength={100} value={formData.BPJS_Kesehatan} onChange={(e) => setFormData({ ...formData, BPJS_Kesehatan: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="BPJS_Ketenagakerjaan" className="text-sm font-medium text-slate-700">BPJS Ketenagakerjaan</Label>
                  <Input id="BPJS_Ketenagakerjaan" maxLength={100} value={formData.BPJS_Ketenagakerjaan} onChange={(e) => setFormData({ ...formData, BPJS_Ketenagakerjaan: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hire_date" className="text-sm font-medium text-slate-700">Hire Date</Label>
                  <Input id="hire_date" type="date" required value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="resign_date" className="text-sm font-medium text-slate-700">Resign Date</Label>
                  <Input id="resign_date" type="date" value={formData.resign_date} onChange={(e) => setFormData({ ...formData, resign_date: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="idPosition" className="text-sm font-medium text-slate-700">Position ID</Label>
                  <Input id="idPosition" type="number" required min={1} value={formData.idPosition} onChange={(e) => setFormData({ ...formData, idPosition: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="idDepartment" className="text-sm font-medium text-slate-700">Department ID</Label>
                  <Input id="idDepartment" type="number" required min={1} value={formData.idDepartment} onChange={(e) => setFormData({ ...formData, idDepartment: e.target.value })} className="h-10 rounded-lg border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Status</Label>
                  <Select value={formData.employment_status} onValueChange={(v) => setFormData({ ...formData, employment_status: (v || "active") as FormData["employment_status"] })}>
                    <SelectTrigger className="h-10 rounded-lg border-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="fired">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-10 rounded-lg border-slate-300">Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white">
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama, email, atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-lg border-slate-300 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Employee code</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Nama Karyawan</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Gender</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Role</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Kontak</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Email</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Tgl Masuk</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  </TableCell>
                </TableRow>
              ) : filteredKaryawan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    Tidak ada data karyawan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKaryawan.map((row) => (
                  <TableRow
                    key={row.employeeId}
                    onClick={() => openDetail(row)}
                    className="border-slate-200 hover:bg-slate-50 transition-colors h-12 cursor-pointer"
                  >
                    <TableCell className="text-sm text-slate-600 tabular-nums">{row.employeeId}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{row.firstName} {row.lastName || ""}</TableCell>
                    <TableCell className="text-sm text-slate-600">{row.gender === "L" ? "Laki-laki" : row.gender === "P" ? "Perempuan" : row.gender}</TableCell>
                    <TableCell className="text-sm text-slate-600">{row.role}</TableCell>
                    <TableCell className="text-sm text-slate-600 tabular-nums">{row.noTelp || "-"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{row.email}</TableCell>
                    <TableCell className="text-sm text-slate-600 tabular-nums">{row.hireDate}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        row.employmentStatus === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {row.employmentStatus === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-xl border-slate-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">Detail Karyawan</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Employee code</span><p className="font-medium text-slate-900">{selected.employeeId}</p></div>
              <div><span className="text-slate-500">Nama</span><p className="font-medium text-slate-900">{selected.firstName} {selected.lastName || ""}</p></div>
              <div><span className="text-slate-500">Gender</span><p className="font-medium text-slate-900">{selected.gender === "L" ? "Laki-laki" : selected.gender === "P" ? "Perempuan" : selected.gender}</p></div>
              <div><span className="text-slate-500">Role</span><p className="font-medium text-slate-900">{selected.role}</p></div>
              <div><span className="text-slate-500">No Telepon</span><p className="font-medium text-slate-900">{selected.noTelp || "-"}</p></div>
              <div><span className="text-slate-500">Email</span><p className="font-medium text-slate-900">{selected.email}</p></div>
              <div><span className="text-slate-500">Tgl Masuk</span><p className="font-medium text-slate-900">{selected.hireDate}</p></div>
              <div><span className="text-slate-500">Status</span><p className="font-medium text-slate-900">{selected.employmentStatus === "active" ? "Aktif" : "Nonaktif"}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
