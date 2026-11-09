import { apiFetch } from "@/lib/api";

export type AttendanceStatistic = {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string | null;
  month: number;
  year: number;
  totalEffectiveDays: number;
  totalPresent: number;
  totalAlpha: number;
  totalPermission: number;
  totalOvertime: number;
  totalLate: number;
};

export type AttendanceStatisticsResponse = {
  success: boolean;
  message: string;
  total?: number;
  data?: AttendanceStatistic[];
};

export type GenerateStatisticsResponse = {
  success: boolean;
  message: string;
  period?: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    defaultEffectiveDays: number;
  };
  totalEmployees?: number;
  data?: AttendanceStatistic[];
};

export async function fetchAttendanceStatistics(
  month: number,
  year: number,
): Promise<AttendanceStatisticsResponse> {
  const response = await apiFetch(
    `/statistic/attendance-statistics?month=${month}&year=${year}`,
  );
  return response.json() as Promise<AttendanceStatisticsResponse>;
}

export async function generateAttendanceStatistics(
  month: number,
  year: number,
): Promise<GenerateStatisticsResponse> {
  const response = await apiFetch("/statistic/attendance-statistics/generate", {
    method: "POST",
    body: JSON.stringify({ month, year }),
  });
  return response.json() as Promise<GenerateStatisticsResponse>;
}
