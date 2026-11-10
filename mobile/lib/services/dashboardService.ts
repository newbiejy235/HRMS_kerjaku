import { getToken } from "../auth";

export interface AttendanceSummary {
  presentDays: number;
  totalTargetDays: number;
  percentage: number;
  onTimeCount: number;
  lateCount: number;
  overtimeHours: number;
  permissionDays: number;
  periodName: string;
}

export interface TodayShift {
  isOffDay: boolean;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  outletName?: string;
  note?: string;
}

export interface EmployeeNotification {
  id: string;
  title: string;
  description: string;
  category: "jadwal" | "pengajuan";
  status: "Menunggu" | "Disetujui" | "Ditolak" | "Info";
  dateFormatted: string;
}

export interface DashboardData {
  employee: {
    name: string;
    role: string;
    position: string;
    id_employee: string;
  };
  attendance: AttendanceSummary;
  todayShift: TodayShift;
  notifications: EmployeeNotification[];
}

export interface EmployeeProfile {
  employeeId: string;
  firstName: string;
  lastName?: string;
  gender: string;
  noTelp?: string;
  hireDate: string;
  employmentStatus: string;
  email: string;
  role: string;
  position?: string;
  outlet?: string;
}

export interface ShiftScheduleItem {
  shiftId: number;
  shiftDate: string;
  employeeLocate: string;
  category: string;
  normal_time_in: string;
  normal_time_out: string;
}

export interface PayrollDetail {
  detailId: number;
  componentId: number;
  componentName: string;
  type: "earning" | "deduction";
  amount: string;
}

export interface SlipGaji {
  payroll: {
    payrollId: number;
    employeeId: string;
    payrollPeriod: string;
    totalEarnings: string;
    totalDeductions: string;
    netSalary: string;
  };
  details: {
    earnings: PayrollDetail[];
    deductions: PayrollDetail[];
  };
}

export interface AttendanceSubmitPayload {
  token: string;
  latitude: number;
  longitude: number;
}

export interface AttendanceSubmitResult {
  success: boolean;
  message: string;
  data?: {
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: string;
    distance: number;
    allowedRadius: number;
  };
}

export interface PermissionRequestPayload {
  start_date: string;
  end_date: string;
  permit_type: "permission" | "sick" | "holiday";
  permit_reason: string;
}

export interface OvertimeRequestPayload {
  overtimeDate: string;
  overtimeTotal: number;
  description: string;
}

export interface ReimbursementItem {
  id: number;
  employeeId: string;
  name: string;
  description?: string;
  amount: string;
  receiptPhoto?: string;
  expenseDate: string;
  status: string;
  createdAt: string;
}

export interface TelegramPairingResult {
  success: boolean;
  connected: boolean;
  telegramUrl?: string;
  expiresAt?: string;
  message: string;
}

export interface TelegramStatusResult {
  success: boolean;
  connected: boolean;
  message: string;
}

// Default sekarang pakai API asli. Mock cuma aktif kalau NEXT_PUBLIC_USE_MOCK=true
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const authHeaders = (token: string | null) => ({
  Authorization: `Bearer ${token ?? ""}`,
  "Content-Type": "application/json",
});

/** Error dari BE: menyimpan HTTP status dan field `data` dari response error */
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errData = (await res.json().catch(() => null)) as {
      message?: string;
      data?: any;
    } | null;

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[API ${res.status}] ${res.url}`,
        errData ?? "(response bukan JSON)",
      );
    }

    // 404 tanpa body JSON = route tidak ada (Express balikin HTML "Cannot POST ...")
    const fallback =
      !errData && res.status === 404
        ? `Endpoint tidak ditemukan (404): ${res.url}`
        : "Terjadi kesalahan pada server";

    throw new ApiError(errData?.message || fallback, res.status, errData?.data);
  }
  return res.json();
};

/* ------------------------- Helper shift (WIB) ------------------------- */

/** Tanggal hari ini di WIB, format YYYY-MM-DD */
export const getTodayWIB = (): string =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

/** Samakan format shiftDate dari BE (bisa "2026-11-10" atau ISO timestamp) jadi YYYY-MM-DD WIB */
export const normalizeShiftDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
};

export const formatShiftCategory = (category?: string): string => {
  switch (category) {
    case "Morning":
      return "Shift Pagi";
    case "Afternoon":
      return "Shift Siang";
    case "Night":
    case "Evening":
      return "Shift Malam";
    default:
      return category || "Shift";
  }
};

/** "08:00:00" -> "08:00" */
export const formatShiftTime = (time?: string): string =>
  time ? time.slice(0, 5) : "-";

export const dashboardService = {
  // async getDashboardData(): Promise<DashboardData> {
  //   if (USE_MOCK) {
  //     await delay(400);
  //     return {
  //       employee: {
  //         name: "Budi",
  //         role: "Karyawan",
  //         position: "Barista Senior",
  //         id_employee : ""
  //       },
  //       attendance: {
  //         presentDays: 18,
  //         totalTargetDays: 22,
  //         percentage: 82,
  //         onTimeCount: 16,
  //         lateCount: 2,
  //         overtimeHours: 4.5,
  //         permissionDays: 1,
  //         periodName: "November 2026",
  //       },
  //       todayShift: {
  //         isOffDay: false,
  //         shiftName: "Shift Pagi",
  //         startTime: "08:00",
  //         endTime: "16:00",
  //         outletName: "Outlet Kemang",
  //         note: "Toleransi keterlambatan 10 menit",
  //       },
  //       notifications: [
  //         {
  //           id: "notif-1",
  //           title: "Jadwal Besok diubah",
  //           description:
  //             "Shift Siang (12:00) diganti menjadi Shift Pagi (08:00 - 16:00).",
  //           category: "jadwal",
  //           status: "Info",
  //           dateFormatted: "Besok, 11 Nov",
  //         },
  //         {
  //           id: "notif-2",
  //           title: "Pengajuan izin 12 Nov",
  //           description:
  //             "Pengajuan izin alasan keluarga sedang menunggu ditinjau oleh HR Outlet.",
  //           category: "pengajuan",
  //           status: "Menunggu",
  //           dateFormatted: "12 Nov 2026",
  //         },
  //       ],
  //     };
  //   }

  //   const token = getToken();

  //   // Ambil profil untuk info karyawan
  //   const [profileRes, shiftRes, slipRes] = await Promise.all([
  //     fetch(`${API_URL}/data/myProfile`, { headers: authHeaders(token) }),
  //     fetch(`${API_URL}/data/my-shift`, { headers: authHeaders(token) }),
  //     fetch(`${API_URL}/data/my-slip`, { headers: authHeaders(token) }),
  //   ]);

  //   if (!profileRes.ok) {
  //     throw new Error("Gagal memuat data karyawan");
  //   }

  //   const profileJson = await profileRes.json();
  //   const user = profileJson.data?.user || profileJson.data || profileJson;

  //   const attendance: AttendanceSummary = {
  //     presentDays: 0,
  //     totalTargetDays: 22,
  //     percentage: 0,
  //     onTimeCount: 0,
  //     lateCount: 0,
  //     overtimeHours: 0,
  //     permissionDays: 0,
  //     periodName: new Date().toLocaleDateString("id-ID", {
  //       month: "long",
  //       year: "numeric",
  //     }),
  //   };

  //   let todayShift: TodayShift = {
  //     isOffDay: true,
  //     note: "Belum ada jadwal hari ini",
  //   };

  //   if (shiftRes.ok) {
  //     const shiftJson = await shiftRes.json();
  //     const shifts = shiftJson.data || shiftJson;
  //     if (Array.isArray(shifts) && shifts.length > 0) {
  //       const today = shifts[0];
  //       todayShift = {
  //         isOffDay: false,
  //         shiftName:
  //           today.category === "Morning"
  //             ? "Shift Pagi"
  //             : today.category === "Afternoon"
  //               ? "Shift Siang"
  //               : "Shift Malam",
  //         startTime: today.normal_time_in,
  //         endTime: today.normal_time_out,
  //         outletName: today.employeeLocate || user.outlet || "Outlet",
  //         note: "Lihat detail di menu Shift",
  //       };
  //     }
  //   }

  //   let notifications: EmployeeNotification[] = [];

  //   return {
  //     employee: {
  //       name: user.firstName || user.name || "Karyawan",
  //       role: user.role || "Karyawan",
  //       position: user.position || "Staf Outlet",
  //       outlet: user.outlet || "Outlet",
  //     },
  //     attendance,
  //     todayShift,
  //     notifications,
  //   };
  // },

  /** Profil karyawan yang login (GET /data/myProfile). Selalu pakai API asli. */
  async getProfile(): Promise<EmployeeProfile> {
    const token = getToken();
    const res = await fetch(`${API_URL}/data/myProfile`, {
      headers: authHeaders(token),
    });
    const json = await handleResponse(res);
    return json.data.user;
  },

  /**
   * Ambil jadwal shift milik karyawan yang login (GET /data/my-shift).
   * Selalu pakai API asli, tanpa data dummy.
   */
  async getShiftSchedule(): Promise<ShiftScheduleItem[]> {
    const token = getToken();
    const res = await fetch(`${API_URL}/data/my-shift`, {
      headers: authHeaders(token),
    });
    const json = await handleResponse(res);
    const data = json.data ?? json;
    return Array.isArray(data) ? data : [];
  },

  /** Slip gaji karyawan yang login (GET /data/my-slip). Selalu pakai API asli. */
  async getSlipGaji(): Promise<SlipGaji> {
    const token = getToken();
    const res = await fetch(`${API_URL}/data/my-slip`, {
      headers: authHeaders(token),
    });
    const json = await handleResponse(res);
    return json.data;
  },

  async submitAttendance(
    payload: AttendanceSubmitPayload,
  ): Promise<AttendanceSubmitResult> {
    const token = getToken();
    const res = await fetch(`${API_URL}/attendance/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async requestPermission(
    payload: PermissionRequestPayload,
  ): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK) {
      await delay(600);
      return { success: true, message: "Pengajuan izin berhasil dibuat" };
    }

    const token = getToken();
    const res = await fetch(`${API_URL}/permission/request/employee`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async requestOvertime(
    payload: OvertimeRequestPayload,
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    if (USE_MOCK) {
      await delay(600);
      return { success: true, message: "Pengajuan lembur berhasil dibuat" };
    }

    const token = getToken();
    const res = await fetch(`${API_URL}/permission/request/overtime`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getReimbursements(): Promise<ReimbursementItem[]> {
    if (USE_MOCK) {
      await delay(400);
      return [];
    }

    const token = getToken();
    const res = await fetch(`${API_URL}/reimbursements/`, {
      headers: authHeaders(token),
    });
    const json = await handleResponse(res);
    return json.data;
  },

  async createReimbursement(payload: {
    name: string;
    description?: string;
    amount: string;
    receiptPhoto?: string;
    expenseDate: string;
  }): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK) {
      await delay(600);
      return {
        success: true,
        message: "Pengajuan reimbursement berhasil dibuat",
      };
    }

    const token = getToken();
    const res = await fetch(`${API_URL}/reimbursements/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getAttendanceStats(employeeId: string): Promise<{
    totalPresent: number;
    totalLate: number;
    totalPermission: number;
    totalOvertime: number;
    totalAlpha: number;
  }> {
    if (USE_MOCK) {
      await delay(400);
      return {
        totalPresent: 0,
        totalLate: 0,
        totalPermission: 0,
        totalOvertime: 0,
        totalAlpha: 0,
      };
    }

    const token = getToken();
    const res = await fetch(
      `${API_URL}/statistic/attendance-statistics/${employeeId}`,
      {
        headers: authHeaders(token),
      },
    );
    const json = await handleResponse(res);
    return json.data;
  },

  async createTelegramPairing(): Promise<TelegramPairingResult> {
    if (USE_MOCK) {
      await delay(500);
      return {
        success: true,
        connected: false,
        telegramUrl: `https://t.me/${process.env.TELEGRAM_BOT_NAME || "Kerjaku_clientServiceBOT"}?start=mock-pairing-token`,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        message: "Silakan hubungkan akun Telegram Anda",
      };
    }

    const token = getToken();
    const res = await fetch(`${API_URL}/activation/pairing`, {
      method: "POST",
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },

  async getTelegramStatus(): Promise<TelegramStatusResult> {
    if (USE_MOCK) {
      await delay(400);
      return {
        success: true,
        connected: false,
        message: "Telegram belum terhubung",
      };
    }

    const token = getToken();
    const res = await fetch(`${API_URL}/activation/status`, {
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },
};
