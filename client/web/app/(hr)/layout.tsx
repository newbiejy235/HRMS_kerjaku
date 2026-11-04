"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "HR") {
      router.replace("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 z-20">
        <Sidebar role="hr" />
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar role="hr" />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col lg:pl-64">
        <Topbar onMenuClick={() => setIsMobileOpen(true)} role="hr" />
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}