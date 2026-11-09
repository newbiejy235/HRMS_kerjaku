import { apiFetch } from "@/lib/api";

export type MyProfileUser = {
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

export type MyShift = {
  shiftId: number;
  shiftDate: string;
  employeeLocate: string | null;
  category: string;
  normal_time_in: string | null;
  normal_time_out: string | null;
};

export type SlipDetail = {
  detailId: number;
  componentId: number;
  componentName: string;
  type: string;
  amount: string;
};

export type MySlip = {
  payroll: {
    payrollId: number;
    employeeId: string;
    payrollPeriod: string;
    totalEarnings: string;
    totalDeductions: string;
    netSalary: string;
  };
  details: {
    earnings: SlipDetail[];
    deductions: SlipDetail[];
  };
};

export async function fetchMyProfile(): Promise<MyProfileUser> {
  const res = await apiFetch("/data/myProfile");
  const result = await res.json();
  if (!result?.success) {
    throw new Error(result?.message || "Gagal mengambil data profil.");
  }
  return result.data.user;
}

export async function fetchMyShifts(): Promise<MyShift[]> {
  const res = await apiFetch("/data/my-shift");
  const result = await res.json();
  if (!result?.success) {
    throw new Error(result?.message || "Gagal mengambil jadwal shift.");
  }
  return result.data || [];
}

export async function fetchMySlip(): Promise<MySlip | null> {
  const res = await apiFetch("/data/my-slip");
  const result = await res.json();
  // Backend membalas 404 ketika karyawan belum memiliki payroll sama sekali.
  if (res.status === 404) return null;
  if (!result?.success) {
    throw new Error(result?.message || "Gagal mengambil slip gaji.");
  }
  return result.data;
}
