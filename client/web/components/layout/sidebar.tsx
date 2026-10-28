"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Clock, CalendarDays, 
  FileText, Settings, LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

const menus = {
  hr: [
    { name: "Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
    { name: "Karyawan", href: "/hr/employees", icon: Users },
    { name: "Kehadiran", href: "/hr/attendance", icon: Clock },
    { name: "Shift", href: "/hr/shift", icon: CalendarDays },
    { name: "Pengajuan", href: "/hr/requests", icon: FileText },
  ],
  finance: [
    { name: "Dashboard", href: "/finance/dashboard", icon: LayoutDashboard },
    { name: "Penggajian", href: "/finance/payroll", icon: FileText },
    { name: "Laporan", href: "/finance/reports", icon: FileText },
  ],
};

export function Sidebar({ role }: { role: "hr" | "finance" }) {
  const pathname = usePathname();
  const menuItems = menus[role];

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-xl font-bold text-primary font-heading tracking-tight">
          KerjaKu.
        </span>
      </div>

      {/* Navigation */}
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
                  ? "bg-emerald-50 text-emerald-800" // <-- Diubah ke Emerald
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-emerald-800" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Settings className="h-[18px] w-[18px] text-slate-400" />
          Pengaturan
        </Link>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] text-rose-500" />
          Keluar
        </button>
      </div>
    </div>
  );
}