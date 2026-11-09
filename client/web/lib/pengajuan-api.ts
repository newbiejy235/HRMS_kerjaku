import { apiFetch } from "@/lib/api";

export type Employee = {
  employeeId: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await apiFetch("/data/");
  const result = await res.json();
  if (!result?.success) throw new Error(result?.message || "Gagal mengambil data karyawan.");
  return (result.data || []).map((e: Record<string, unknown>) => ({
    employeeId: String(e.employeeId),
    firstName: String(e.firstName),
    lastName: e.lastName == null ? null : String(e.lastName),
    email: String(e.email),
  }));
}

export type Reimbursement = {
  id: number;
  employeeId: string;
  name: string;
  description: string | null;
  amount: string;
  receiptPhoto: string | null;
  expenseDate: string;
  status: string;
  reviewBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt?: string;
};

export async function fetchReimbursements(): Promise<Reimbursement[]> {
  const res = await apiFetch("/reimbursements/");
  const result = await res.json();
  if (!result?.success) throw new Error(result?.message || "Gagal mengambil data reimbursement.");
  return (result.data || []).map((r: Record<string, unknown>) => ({
    id: Number(r.id),
    employeeId: String(r.employeeId),
    name: String(r.name),
    description: r.description == null ? null : String(r.description),
    amount: String(r.amount),
    receiptPhoto: r.receiptPhoto == null ? null : String(r.receiptPhoto),
    expenseDate: String(r.expenseDate),
    status: String(r.status),
    reviewBy: r.reviewBy == null ? null : Number(r.reviewBy),
    reviewedAt: r.reviewedAt == null ? null : String(r.reviewedAt),
    rejectionReason: r.rejectionReason == null ? null : String(r.rejectionReason),
    createdAt: r.createdAt == null ? undefined : String(r.createdAt),
  }));
}

export async function reviewReimbursement(
  id: number,
  status: "approved" | "rejected",
  rejectionReason?: string
) {
  const body =
    status === "approved"
      ? { status: "approved" }
      : { status: "rejected", rejectionReason: rejectionReason?.trim() || null };

  const res = await apiFetch(`/reimbursements/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mereview reimbursement.");
  return result;
}

export type NotificationItem = {
  id: number;
  employeeCode: string;
  date: string;
  status: string;
};

function mapNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: Number(raw.id),
    employeeCode: String(raw.employeeCode),
    date: String(raw.date ?? raw.createdAt ?? ""),
    status: String(raw.status),
  };
}

export async function fetchPermissionNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch("/getNotification/permission");
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mengambil data izin kerja.");
  return (result.data || []).map((r: Record<string, unknown>) => mapNotification(r));
}

export async function fetchOvertimeNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch("/getNotification/overtime");
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mengambil data lembur.");
  return (result.data || []).map((r: Record<string, unknown>) => mapNotification(r));
}

export async function fetchReimbursementNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch("/getNotification/reimbursement");
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mengambil data reimbursement.");
  return (result.data || []).map((r: Record<string, unknown>) => mapNotification(r));
}

export async function fetchResetPasswordNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch("/getNotification/reset-password");
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mengambil data reset password.");
  return (result.data || []).map((r: Record<string, unknown>) => mapNotification(r));
}

export async function reviewPermission(idPermission: number, status: "accepted" | "rejected") {
  const res = await apiFetch("/manage/response/permission", {
    method: "POST",
    body: JSON.stringify({
      id_permission: idPermission,
      status,
    }),
  });
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mereview izin kerja.");
  return result;
}

export async function reviewOvertime(idOvertime: number, status: "accepted" | "rejected") {
  const res = await apiFetch("/manage/response/overtime", {
    method: "POST",
    body: JSON.stringify({
      id_overtime: idOvertime,
      status,
    }),
  });
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mereview lembur.");
  return result;
}

export async function reviewResetPassword(requestId: number, status: "approved" | "rejected") {
  const res = await apiFetch("/verification/review", {
    method: "POST",
    body: JSON.stringify({
      requestId,
      status,
    }),
  });
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal mereview reset password.");
  return result;
}

export async function createOvertime(payload: {
  id_employee: string;
  overtimeDate: string;
  overtimeTotal: number;
  description?: string;
}) {
  // Pastikan format ISO datetime memiliki detik (contoh: 2026-12-08T19:49:00)
  let dateStr = payload.overtimeDate.trim();
  if (dateStr.length === 16) {
    dateStr = `${dateStr}:00`;
  }

  const res = await apiFetch("/manage/create/overtime", {
    method: "POST",
    body: JSON.stringify({
      id_employee: payload.id_employee,
      overtimeDate: dateStr,
      overtimeTotal: payload.overtimeTotal,
      description: payload.description || undefined,
    }),
  });
  const result = await res.json();
  if (!res.ok || !result?.success) throw new Error(result?.message || "Gagal membuat lembur.");
  return result;
}
