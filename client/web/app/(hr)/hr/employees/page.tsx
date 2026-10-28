"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dummyKaryawan = [
  { id: 1, nip: "KRY-001", nama: "Budi Santoso", jabatan: "Barista", outlet: "Kemang", status: "Aktif", tglMasuk: "12 Jan 2024" },
  { id: 2, nip: "KRY-002", nama: "Siti Aminah", jabatan: "Kasir", outlet: "Senopati", status: "Aktif", tglMasuk: "05 Mar 2024" },
  { id: 3, nip: "KRY-003", nama: "Andi Wijaya", jabatan: "Cook", outlet: "Kemang", status: "Aktif", tglMasuk: "20 Agu 2023" },
  { id: 4, nip: "KRY-004", nama: "Dewi Lestari", jabatan: "Barista", outlet: "Tebet", status: "Nonaktif", tglMasuk: "15 Nov 2023" },
  { id: 5, nip: "KRY-005", nama: "Rina Wulandari", jabatan: "Kepala Gerai", outlet: "Senopati", status: "Aktif", tglMasuk: "01 Feb 2023" },
];

export default function KaryawanPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredKaryawan = dummyKaryawan.filter((k) =>
    k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">Kelola Karyawan</h1>
          <p className="text-sm text-slate-500 mt-1">Manajemen data, kontrak, dan status karyawan.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Karyawan
            </Button>
          }>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-6 rounded-xl border-slate-200">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">Tambah Karyawan Baru</DialogTitle>
            </DialogHeader>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nama" className="text-sm font-medium text-slate-700">Nama Lengkap</Label>
                  <Input id="nama" placeholder="Sesuai KTP" className="h-10 rounded-lg border-slate-300 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nip" className="text-sm font-medium text-slate-700">NIP</Label>
                  <Input id="nip" placeholder="KRY-006" className="h-10 rounded-lg border-slate-300 tabular-nums" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="jabatan" className="text-sm font-medium text-slate-700">Jabatan</Label>
                  <Select>
                    <SelectTrigger className="h-10 rounded-lg border-slate-300">
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barista">Barista</SelectItem>
                      <SelectItem value="kasir">Kasir</SelectItem>
                      <SelectItem value="cook">Cook</SelectItem>
                      <SelectItem value="kepala-gerai">Kepala Gerai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="outlet" className="text-sm font-medium text-slate-700">Outlet</Label>
                  <Select>
                    <SelectTrigger className="h-10 rounded-lg border-slate-300">
                      <SelectValue placeholder="Pilih outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kemang">Kemang</SelectItem>
                      <SelectItem value="senopati">Senopati</SelectItem>
                      <SelectItem value="tebet">Tebet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 rounded-lg border-slate-300">
                  Batal
                </Button>
                <Button type="button" onClick={() => setIsDialogOpen(false)} className="h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white">
                  Simpan Data
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
              placeholder="Cari nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-lg border-slate-300 bg-white"
            />
          </div>
          <Button variant="outline" className="h-10 rounded-lg border-slate-300 text-slate-700 w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filter Outlet
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">NIP</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Nama Karyawan</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Jabatan</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Outlet</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">Tgl Masuk</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKaryawan.map((row) => (
                <TableRow key={row.id} className="border-slate-200 hover:bg-slate-50 transition-colors h-12">
                  <TableCell className="text-sm text-slate-600 tabular-nums">{row.nip}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-900">{row.nama}</TableCell>
                  <TableCell className="text-sm text-slate-600">{row.jabatan}</TableCell>
                  <TableCell className="text-sm text-slate-600">{row.outlet}</TableCell>
                  <TableCell className="text-sm text-slate-600 tabular-nums">{row.tglMasuk}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      row.status === "Aktif" 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredKaryawan.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            Tidak ada data karyawan yang cocok dengan pencarian "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}