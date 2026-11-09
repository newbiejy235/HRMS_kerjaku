"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Timer,
  QrCode,
  Coins,
  UserCheck,
  Receipt,
  ChartNoAxesCombined
} from "lucide-react";
import { cn } from "@/lib/utils";

const menus = {
  hr: [
    { name: "Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
    { name: "Karyawan", href: "/hr/employees", icon: Users },
    { name: "Kehadiran", href: "/hr/attendance", icon: Clock },
    { name: "Statistik Kehadiran", href: "/hr/statistic", icon: ChartNoAxesCombined },
    { name: "Kiosk QR Absensi", href: "/attendance/qr/generate", icon: QrCode },
    { name: "Shift", href: "/hr/shift", icon: CalendarDays },
    { name: "Tugaskan Lembur", href: "/hr/lembur", icon: Timer },
    { name: "Pengajuan", href: "/hr/pengajuan", icon: FileText },
    { name: "Komponen Gaji", href: "/hr/payroll/components", icon: Coins },
    { name: "Alokasi Gaji", href: "/hr/payroll/allocations", icon: UserCheck },
    { name: "Detail Payroll", href: "/hr/payroll/details", icon: Receipt },
  ],
  finance: [
    { name: "Dashboard", href: "/finance/dashboard", icon: LayoutDashboard },
    { name: "Komponen Gaji", href: "/finance/components", icon: Coins },
    { name: "Alokasi Gaji", href: "/finance/allocations", icon: UserCheck },
    { name: "Detail Payroll", href: "/finance/details", icon: Receipt },
    { name: "Penggajian", href: "/finance/payroll", icon: FileText },
  ],
};

export function Sidebar({ role }: { role: "hr" | "finance" }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuItems = menus[role];
  const settingsHref = role === "hr" ? "/hr/settings" : "/finance/settings";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-xl font-bold text-primary font-heading tracking-tight">
          KerjaKu.
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px]",
                  isActive ? "text-emerald-800" : "text-slate-400",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link
          href={settingsHref}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(settingsHref)
              ? "bg-emerald-50 text-emerald-800"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <Settings
            className={cn(
              "h-[18px] w-[18px]",
              pathname.startsWith(settingsHref)
                ? "text-emerald-800"
                : "text-slate-400",
            )}
          />
          Pengaturan
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] text-rose-500" />
          Keluar
        </button>
      </div>
    </div>
  );
}
