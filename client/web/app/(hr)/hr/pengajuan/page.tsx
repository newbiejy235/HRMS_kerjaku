"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, Clock, KeyRound, Receipt, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  fetchPermissionNotifications,
  fetchOvertimeNotifications,
  fetchReimbursementNotifications,
  fetchResetPasswordNotifications,
  type NotificationItem,
} from "@/lib/pengajuan-api";

type CategoryStat = {
  title: string;
  desc: string;
  href: string;
  icon: typeof FileText;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

const emptyStat = (title: string, desc: string, href: string, icon: typeof FileText): CategoryStat => ({
  title,
  desc,
  href,
  icon,
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});

function countStatus(rows: NotificationItem[]) {
  const c = { total: rows.length, pending: 0, approved: 0, rejected: 0 };
  rows.forEach((r) => {
    const s = r.status.toLowerCase();
    if (s === "pending") c.pending++;
    else if (s === "approved" || s === "accepted") c.approved++;
    else if (s === "rejected") c.rejected++;
  });
  return c;
}

export default function PengajuanHubPage() {
  const [stats, setStats] = useState<CategoryStat[]>([
    emptyStat("Izin Kerja", "Pengajuan izin, sakit, dan cuti karyawan.", "/hr/pengajuan/izin-kerja", FileText),
    emptyStat("Lembur", "Pengajuan lembur yang diajukan karyawan.", "/hr/pengajuan/lembur", Clock),
    emptyStat("Reset Password", "Permintaan reset password karyawan.", "/hr/pengajuan/reset-password", KeyRound),
    emptyStat("Reimbursement", "Pengajuan klaim reimbursement karyawan.", "/hr/pengajuan/reimbursement", Receipt),
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetchPermissionNotifications(),
      fetchOvertimeNotifications(),
      fetchResetPasswordNotifications(),
      fetchReimbursementNotifications(),
    ]).then((results) => {
      setStats((prev) => {
        const next = [...prev];
        const apply = (idx: number, rows: NotificationItem[]) => {
          const c = countStatus(rows);
          next[idx] = { ...next[idx], total: c.total, pending: c.pending, approved: c.approved, rejected: c.rejected };
        };
        if (results[0].status === "fulfilled") apply(0, results[0].value);
        if (results[1].status === "fulfilled") apply(1, results[1].value);
        if (results[2].status === "fulfilled") apply(2, results[2].value);
        if (results[3].status === "fulfilled") apply(3, results[3].value);
        return next;
      });
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-heading tracking-tight">Panel Pengajuan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola seluruh pengajuan yang dikirimkan oleh karyawan.</p>
        </div>
        <Link href="/hr/lembur">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Tugaskan Lembur HR
          </Button>
        </Link>
      </div>

      {/* Banner Penugasan Lembur */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-emerald-950">Ingin menugaskan lembur langsung ke karyawan?</h3>
          <p className="text-xs text-emerald-800 mt-0.5">
            Gunakan Dashboard Penugasan Lembur untuk membuat jadwal lembur dari HR dengan status otomatis diterima (Accepted).
          </p>
        </div>
        <Link href="/hr/lembur">
          <Button variant="outline" size="sm" className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 whitespace-nowrap">
            Buka Dashboard Lembur
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {isLoading && <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:border-emerald-300 hover:shadow transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <c.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{c.title}</h2>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-slate-500 mt-3">{c.desc}</p>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Total</p>
                <p className="font-semibold text-slate-900 mt-0.5 text-sm">{c.total}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Pending</p>
                <p className="font-semibold text-amber-600 mt-0.5 text-sm">{c.pending}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Approved</p>
                <p className="font-semibold text-emerald-600 mt-0.5 text-sm">{c.approved}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Rejected</p>
                <p className="font-semibold text-rose-600 mt-0.5 text-sm">{c.rejected}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
