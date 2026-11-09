"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  FileText,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  User,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  fetchMyProfile,
  fetchMyShifts,
  fetchMySlip,
  type MyProfileUser,
  type MyShift,
  type MySlip,
} from "@/lib/profile-api";

type TabKey = "overview" | "personal" | "shift" | "slip";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "personal", label: "Personal Information", icon: Briefcase },
  { key: "shift", label: "My Shift", icon: CalendarDays },
  { key: "slip", label: "My Salary Slip", icon: Wallet },
];

const rupiah = (value: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const tanggal = (value?: string | null) => {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const periode = (value: string) => {
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
};

const jam = (value?: string | null) => (value ? value.slice(0, 5) : "-");

const genderLabel = (value: string) =>
  value === "L" ? "Laki-laki" : value === "P" ? "Perempuan" : "-";

const statusLabel = (value: string) =>
  value === "active" ? "Aktif" : value === "fired" ? "Non-aktif" : value;

const statusClass = (value: string) =>
  value === "active"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-rose-100 text-rose-700";

const categoryClass = (value: string) => {
  if (value === "Morning") return "bg-amber-100 text-amber-700";
  if (value === "Afternoon") return "bg-sky-100 text-sky-700";
  return "bg-violet-100 text-violet-700";
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">
        {value}
      </span>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-rose-500" />
      <p className="text-sm text-rose-700">{message}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="bg-white border-rose-300 text-rose-700 hover:bg-rose-100"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Coba lagi
      </Button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <FileText className="h-8 w-8 text-slate-400" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
      <p className="text-sm text-slate-500">Memuat data profil...</p>
    </div>
  );
}

export function MyProfile() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [profile, setProfile] = useState<MyProfileUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [shifts, setShifts] = useState<MyShift[] | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);

  const [slip, setSlip] = useState<MySlip | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setProfileError(null);
      setShiftError(null);
      setSlipError(null);

      const [profileResult, shiftResult, slipResult] = await Promise.allSettled(
        [fetchMyProfile(), fetchMyShifts(), fetchMySlip()],
      );

      if (cancelled) return;

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
      } else {
        setProfileError(
          profileResult.reason instanceof Error
            ? profileResult.reason.message
            : "Gagal memuat profil.",
        );
      }

      if (shiftResult.status === "fulfilled") {
        setShifts(shiftResult.value);
      } else {
        setShiftError(
          shiftResult.reason instanceof Error
            ? shiftResult.reason.message
            : "Gagal memuat jadwal shift.",
        );
      }

      if (slipResult.status === "fulfilled") {
        setSlip(slipResult.value);
      } else {
        setSlipError(
          slipResult.reason instanceof Error
            ? slipResult.reason.message
            : "Gagal memuat slip gaji.",
        );
      }

      setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  if (isLoading) return <LoadingState />;

  const fullName = profile
    ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
    : "Profil Saya";
  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName?.charAt(0) || ""}`.toUpperCase()
    : "?";

  const shiftList = shifts || [];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        {profileError ? (
          <ErrorState message={profileError} onRetry={retry} />
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar className="h-16 w-16 border border-emerald-100">
              <AvatarFallback className="bg-emerald-50 text-emerald-800 text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900 font-heading tracking-tight">
                  {fullName}
                </h1>
                {profile && (
                  <Badge className={statusClass(profile.employmentStatus)}>
                    {statusLabel(profile.employmentStatus)}
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                {profile && <span>{profile.employeeId}</span>}
                {profile && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    {profile.role}
                  </span>
                )}
                {profile && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {profile.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Jadwal Shift</p>
                  <p className="text-lg font-semibold text-slate-900 mt-0.5">
                    {shiftError ? "-" : shiftList.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Slip Gaji Terakhir</p>
                  <p className="text-lg font-semibold text-slate-900 mt-0.5 truncate">
                    {slipError ? "-" : slip ? rupiah(slip.payroll.netSalary) : "Belum ada"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status Karyawan</p>
                  <p className="text-lg font-semibold text-slate-900 mt-0.5">
                    {profile ? statusLabel(profile.employmentStatus) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              Employment Information
            </h2>
            {profileError ? (
              <p className="text-sm text-slate-500 py-3">{profileError}</p>
            ) : profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow label="Employee ID" value={profile.employeeId} />
                <InfoRow label="Role" value={profile.role} />
                <InfoRow label="Tanggal Bergabung" value={tanggal(profile.hireDate)} />
                <InfoRow
                  label="Status Pekerjaan"
                  value={statusLabel(profile.employmentStatus)}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-3">Data tidak tersedia.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "personal" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Personal Information
          </h2>
          {profileError ? (
            <ErrorState message={profileError} onRetry={retry} />
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Nama Lengkap" value={fullName} />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow
                label="Nomor Telepon"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {profile.noTelp || "-"}
                  </span>
                }
              />
              <InfoRow label="Jenis Kelamin" value={genderLabel(profile.gender)} />
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-3">Data tidak tersedia.</p>
          )}
        </div>
      )}

      {activeTab === "shift" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              My Shift
            </h2>
          </div>
          <div className="p-5">
            {shiftError ? (
              <ErrorState message={shiftError} onRetry={retry} />
            ) : shiftList.length === 0 ? (
              <EmptyState message="Belum ada jadwal shift untuk akun ini." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Jam Kerja</TableHead>
                      <TableHead>Lokasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftList.map((shift) => (
                      <TableRow key={shift.shiftId}>
                        <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                          {tanggal(shift.shiftDate)}
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryClass(shift.category)}>
                            {shift.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 whitespace-nowrap">
                          {jam(shift.normal_time_in)} - {jam(shift.normal_time_out)}
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[240px] truncate">
                          {shift.employeeLocate || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "slip" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              My Salary Slip
            </h2>
          </div>
          <div className="p-5">
            {slipError ? (
              <ErrorState message={slipError} onRetry={retry} />
            ) : !slip ? (
              <EmptyState message="Belum ada slip gaji untuk akun ini." />
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Periode Penggajian</p>
                      <p className="text-base font-semibold text-slate-900 mt-0.5">
                        {periode(slip.payroll.payrollPeriod)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {slip.payroll.employeeId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Gaji Bersih</p>
                      <p className="text-xl font-semibold text-emerald-700 mt-0.5">
                        {rupiah(slip.payroll.netSalary)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Total Penerimaan</p>
                      <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                        {rupiah(slip.payroll.totalEarnings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Potongan</p>
                      <p className="text-sm font-semibold text-rose-600 mt-0.5">
                        {rupiah(slip.payroll.totalDeductions)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => setIsDetailOpen(true)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      Lihat Detail Slip
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Slip Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[520px] p-6 rounded-xl border-slate-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 font-heading">
              Detail Slip Gaji
            </DialogTitle>
          </DialogHeader>
          {slip && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Periode</span>
                <span className="font-medium text-slate-900">
                  {periode(slip.payroll.payrollPeriod)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-emerald-700 mb-2">
                  Penerimaan
                </h3>
                {slip.details.earnings.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada data.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Komponen</TableHead>
                        <TableHead className="text-right">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slip.details.earnings.map((item) => (
                        <TableRow key={item.detailId}>
                          <TableCell className="text-slate-700">
                            {item.componentName}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {rupiah(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-rose-700 mb-2">
                  Potongan
                </h3>
                {slip.details.deductions.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada data.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Komponen</TableHead>
                        <TableHead className="text-right">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slip.details.deductions.map((item) => (
                        <TableRow key={item.detailId}>
                          <TableCell className="text-slate-700">
                            {item.componentName}
                          </TableCell>
                          <TableCell className="text-right text-rose-600">
                            {rupiah(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-slate-700">
                  Total Gaji Bersih
                </span>
                <span className="text-base font-semibold text-emerald-700">
                  {rupiah(slip.payroll.netSalary)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
