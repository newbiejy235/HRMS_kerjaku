"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
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
import { apiFetch } from "@/lib/api";
import { POSITION_OPTIONS, DEPARTMENT_OPTIONS } from "@/lib/employee-options";
import { CITY_ID_BY_NAME } from "@/lib/city-id-map";

type Karyawan = {
  employeeId: string;
  userId: number;

  firstName: string;
  lastName: string | null;
  gender: string;

  noTelp: string | null;

  citiesId: number;
  city: string | null;
  province: string | null;

  noRek: string | null;
  nip: string | null;
  NPWP: string | null;
  BPJS_Kesehatan: string | null;
  BPJS_Ketenagakerjaan: string | null;

  hireDate: string;
  resignDate: string | null;

  idPosition: number;
  position: string | null;

  idDepartment: number;
  department: string | null;

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

const fieldLabels: Record<string, string> = {
  email: "Email",
  password: "Password",
  firstName: "Nama depan",
  lastName: "Nama belakang",
  gender: "Jenis kelamin",
  noTelp: "Nomor telepon",
  cities_id: "Kota",
  noRek: "Nomor rekening",
  nip: "NIP",
  NPWP: "NPWP",
  BPJS_Kesehatan: "BPJS Kesehatan",
  BPJS_Ketenagakerjaan: "BPJS Ketenagakerjaan",
  hire_date: "Tanggal masuk",
  resign_date: "Tanggal resign",
  idPosition: "Posisi",
  idDepartment: "Departemen",
  employment_status: "Status karyawan",
};

function showValidationAlert(
  errors: {
    field: string;
    message: string;
  }[],
) {
  const messages = errors.map((error) => {
    const fieldName = fieldLabels[error.field] || error.field;

    return `${fieldName}: ${error.message}`;
  });

  alert(
    `Periksa kembali input berikut:\n\n${messages
      .map((message, index) => `${index + 1}. ${message}`)
      .join("\n")}`,
  );
}

export default function KaryawanPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Karyawan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [cityOptions, setCityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const refreshKaryawan = async () => {
    try {
      const response = await apiFetch("/data");
      const result = await response.json();
      if (result.success) setKaryawan(result.data);
    } catch (error) {
      console.error("Gagal mengambil data karyawan:", error);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token =  localStorage.getItem("token");
        const empRes = await fetch("http://localhost:8000/data", {
          method: "GET", // atau 'POST', 'PUT', 'DELETE', dll.
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Masukkan Bearer Token di sini
          },
        });
        const empResult = await empRes.json();
        if (active && empResult.success) setKaryawan(empResult.data);

        const cityRes = await fetch("http://localhost:8000/cities");
        const cityResult = await cityRes.json();

        if (active && cityResult.success) {
          const cityData = cityResult.data.query;

          setCityOptions(
            cityData.map(
              (c: { id: number; kota: string; provinsi: string }) => ({
                value: String(c.id),
                label: `${c.kota}, ${c.provinsi}`,
              }),
            ),
          );
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredKaryawan = karyawan.filter(
    (k) =>
      k.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.employeeId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi input dasar
    if (!formData.cities_id) {
      alert("Kota wajib dipilih.");
      return;
    }

    if (!formData.idPosition) {
      alert("Posisi karyawan wajib dipilih.");
      return;
    }

    if (!formData.idDepartment) {
      alert("Departemen wajib dipilih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        gender: formData.gender,
        noTelp: formData.noTelp.trim(),
        cities_id: Number(formData.cities_id),
        noRek: formData.noRek.trim(),
        nip: formData.nip.trim(),
        hire_date: formData.hire_date,
        idPosition: Number(formData.idPosition),
        idDepartment: Number(formData.idDepartment),
        employment_status: formData.employment_status,
      };

      // Field opsional
      if (formData.lastName?.trim()) {
        body.lastName = formData.lastName.trim();
      }

      body.NPWP = formData.NPWP?.trim() || null;

      body.BPJS_Kesehatan = formData.BPJS_Kesehatan?.trim() || null;

      body.BPJS_Ketenagakerjaan = formData.BPJS_Ketenagakerjaan?.trim() || null;

      if (formData.resign_date) {
        body.resign_date = formData.resign_date;
      }

      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const result = await response.json();

      // Penanganan error
      if (!response.ok || !result.success) {
        // Error validasi Zod
        if (Array.isArray(result.errors)) {
          const fieldLabels: Record<string, string> = {
            email: "Email",
            password: "Password",
            firstName: "Nama depan",
            lastName: "Nama belakang",
            gender: "Jenis kelamin",
            noTelp: "Nomor telepon",
            cities_id: "Kota",
            noRek: "Nomor rekening",
            nip: "NIP",
            NPWP: "NPWP",
            BPJS_Kesehatan: "BPJS Kesehatan",
            BPJS_Ketenagakerjaan: "BPJS Ketenagakerjaan",
            hire_date: "Tanggal masuk",
            resign_date: "Tanggal resign",
            idPosition: "Posisi",
            idDepartment: "Departemen",
            employment_status: "Status karyawan",
          };

          const errorMessages = result.errors.map(
            (error: { field: string; message: string }, index: number) => {
              const fieldName = fieldLabels[error.field] || error.field;

              return `${index + 1}. ${fieldName}: ${error.message}`;
            },
          );

          alert(
            `Periksa kembali input berikut:\n\n${errorMessages.join("\n")}`,
          );

          return;
        }

        // Error lainnya
        alert(result.message || "Gagal menambahkan karyawan.");
        return;
      }

      // Berhasil
      alert(result.message || "Karyawan berhasil ditambahkan.");

      setIsAddOpen(false);
      setFormData(emptyForm);

      await refreshKaryawan();
    } catch (error) {
      console.error("Gagal menyimpan karyawan:", error);

      alert(
        "Terjadi kesalahan saat menyimpan data. Periksa koneksi atau coba lagi.",
      );
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
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">
            Kelola Karyawan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen data, kontrak, dan status karyawan.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-10 px-4">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Karyawan
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[700px] p-6 rounded-xl border-slate-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
                Tambah Karyawan Baru
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nama Depan
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nama Belakang
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        gender: (v || "") as FormData["gender"],
                      })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg border-slate-300">
                      <SelectValue placeholder="Pilih Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki (L)</SelectItem>
                      <SelectItem value="P">Perempuan (P)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="noTelp"
                    className="text-sm font-medium text-slate-700"
                  >
                    No Telepon
                  </Label>
                  <Input
                    id="noTelp"
                    required
                    minLength={10}
                    maxLength={13}
                    value={formData.noTelp}
                    onChange={(e) =>
                      setFormData({ ...formData, noTelp: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Kota
                  </Label>
                  <Select
                    value={formData.cities_id}
                    onValueChange={(v) =>
                      setFormData({ ...formData, cities_id: v || "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kota" />
                    </SelectTrigger>

                    <SelectContent>
                      {cityOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="noRek"
                    className="text-sm font-medium text-slate-700"
                  >
                    No Rekening
                  </Label>
                  <Input
                    id="noRek"
                    required
                    minLength={10}
                    maxLength={100}
                    value={formData.noRek}
                    onChange={(e) =>
                      setFormData({ ...formData, noRek: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="nip"
                    className="text-sm font-medium text-slate-700"
                  >
                    NIP
                  </Label>
                  <Input
                    id="nip"
                    required
                    minLength={10}
                    maxLength={100}
                    value={formData.nip}
                    onChange={(e) =>
                      setFormData({ ...formData, nip: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="NPWP"
                    className="text-sm font-medium text-slate-700"
                  >
                    NPWP
                  </Label>
                  <Input
                    id="NPWP"
                    maxLength={16}
                    value={formData.NPWP}
                    onChange={(e) =>
                      setFormData({ ...formData, NPWP: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="BPJS_Kesehatan"
                    className="text-sm font-medium text-slate-700"
                  >
                    BPJS Kesehatan
                  </Label>
                  <Input
                    id="BPJS_Kesehatan"
                    maxLength={100}
                    value={formData.BPJS_Kesehatan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        BPJS_Kesehatan: e.target.value,
                      })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="BPJS_Ketenagakerjaan"
                    className="text-sm font-medium text-slate-700"
                  >
                    BPJS Ketenagakerjaan
                  </Label>
                  <Input
                    id="BPJS_Ketenagakerjaan"
                    maxLength={100}
                    value={formData.BPJS_Ketenagakerjaan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        BPJS_Ketenagakerjaan: e.target.value,
                      })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="hire_date"
                    className="text-sm font-medium text-slate-700"
                  >
                    Hire Date
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    required
                    value={formData.hire_date}
                    onChange={(e) =>
                      setFormData({ ...formData, hire_date: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="resign_date"
                    className="text-sm font-medium text-slate-700"
                  >
                    Resign Date
                  </Label>
                  <Input
                    id="resign_date"
                    type="date"
                    value={formData.resign_date}
                    onChange={(e) =>
                      setFormData({ ...formData, resign_date: e.target.value })
                    }
                    className="h-10 rounded-lg border-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Posisi
                  </Label>
                  <Select
                    value={formData.idPosition}
                    onValueChange={(v) =>
                      setFormData({ ...formData, idPosition: v || "" })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg border-slate-300">
                      <SelectValue placeholder="Pilih Posisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={String(p.value)}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Departemen
                  </Label>
                  <Select
                    value={formData.idDepartment}
                    onValueChange={(v) =>
                      setFormData({ ...formData, idDepartment: v || "" })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg border-slate-300">
                      <SelectValue placeholder="Pilih Departemen" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Status
                  </Label>
                  <Select
                    value={formData.employment_status}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        employment_status: (v ||
                          "active") as FormData["employment_status"],
                      })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="fired">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="h-10 rounded-lg border-slate-300"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                >
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
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                  Employee code
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                  Nama Karyawan
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                  Gender
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                  Role
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                  Kontak
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                  Email
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11">
                  Tgl Masuk
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-11 text-right">
                  Status
                </TableHead>
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
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-slate-500"
                  >
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
                    <TableCell className="text-sm text-slate-600 tabular-nums">
                      {row.employeeId}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">
                      {row.firstName} {row.lastName || ""}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {row.gender === "L"
                        ? "Laki-laki"
                        : row.gender === "P"
                          ? "Perempuan"
                          : row.gender}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {row.role}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 tabular-nums">
                      {row.noTelp || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {row.email}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 tabular-nums">
                      {row.hireDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          row.employmentStatus === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.employmentStatus === "active"
                          ? "Aktif"
                          : "Nonaktif"}
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
        <DialogContent className="sm:max-w-[650px] p-6 rounded-xl border-slate-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
              Detail Karyawan
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Informasi lengkap data karyawan.
            </p>
          </DialogHeader>

          {selected && (
            <div className="space-y-6">
              {/* Identitas */}
              <section className="space-y-3">
                <h3 className="font-semibold text-sm text-emerald-700 border-b pb-2">
                  Informasi Identitas
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Employee Code</span>
                    <p className="font-medium text-slate-900">
                      {selected.employeeId}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">User ID</span>
                    <p className="font-medium text-slate-900">
                      {selected.userId ?? "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Nama Lengkap</span>
                    <p className="font-medium text-slate-900">
                      {selected.firstName} {selected.lastName || ""}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Jenis Kelamin</span>
                    <p className="font-medium text-slate-900">
                      {selected.gender === "L"
                        ? "Laki-laki"
                        : selected.gender === "P"
                          ? "Perempuan"
                          : selected.gender || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Nomor Telepon</span>
                    <p className="font-medium text-slate-900">
                      {selected.noTelp || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Kota</span>
                    <p className="font-medium text-slate-900">
                      {selected.city || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Provinsi</span>
                    <p className="font-medium text-slate-900">
                      {selected.province || "-"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Informasi Pekerjaan */}
              <section className="space-y-3">
                <h3 className="font-semibold text-sm text-emerald-700 border-b pb-2">
                  Informasi Pekerjaan
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Posisi</span>
                    <p className="font-medium text-slate-900">
                      {selected.position || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Departemen</span>
                    <p className="font-medium text-slate-900">
                      {selected.department || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">ID Posisi</span>
                    <p className="font-medium text-slate-900">
                      {selected.idPosition ?? "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">ID Departemen</span>
                    <p className="font-medium text-slate-900">
                      {selected.idDepartment ?? "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Tanggal Masuk</span>
                    <p className="font-medium text-slate-900">
                      {selected.hireDate || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Tanggal Resign</span>
                    <p className="font-medium text-slate-900">
                      {selected.resignDate || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Status Karyawan</span>
                    <p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          selected.employmentStatus === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selected.employmentStatus === "active"
                          ? "Aktif"
                          : selected.employmentStatus === "fired"
                            ? "Nonaktif"
                            : selected.employmentStatus || "-"}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              {/* Informasi Akun */}
              <section className="space-y-3">
                <h3 className="font-semibold text-sm text-emerald-700 border-b pb-2">
                  Informasi Akun
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Email</span>
                    <p className="font-medium text-slate-900 break-all">
                      {selected.email || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Role</span>
                    <p className="font-medium text-slate-900">
                      {selected.role || "-"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Informasi Administrasi */}
              <section className="space-y-3">
                <h3 className="font-semibold text-sm text-emerald-700 border-b pb-2">
                  Informasi Administrasi
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">NIP</span>
                    <p className="font-medium text-slate-900">
                      {selected.nip || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">Nomor Rekening</span>
                    <p className="font-medium text-slate-900">
                      {selected.noRek || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">NPWP</span>
                    <p className="font-medium text-slate-900">
                      {selected.NPWP || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">BPJS Kesehatan</span>
                    <p className="font-medium text-slate-900">
                      {selected.BPJS_Kesehatan || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">BPJS Ketenagakerjaan</span>
                    <p className="font-medium text-slate-900">
                      {selected.BPJS_Ketenagakerjaan || "-"}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
