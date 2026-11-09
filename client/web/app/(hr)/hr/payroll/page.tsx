"use client";

import Link from "next/link";
import {
  Coins,
  UserCheck,
  Receipt,
  ArrowRight,
} from "lucide-react";

export default function PayrollHubPage() {
  const cards = [
    {
      title: "Komponen Gaji",
      description:
        "Kelola jenis tunjangan, bonus, insentif, dan potongan gaji karyawan secara terpusat.",
      href: "/hr/payroll/components",
      icon: Coins,
      badge: "CRUD Komponen",
      color: "emerald",
    },
    {
      title: "Alokasi Gaji",
      description:
        "Atur dan tetapkan komponen penghasilan serta nominal rutin tetap untuk setiap karyawan.",
      href: "/hr/payroll/allocations",
      icon: UserCheck,
      badge: "Alokasi Karyawan",
      color: "blue",
    },
    {
      title: "Detail & Riwayat Payroll",
      description:
        "Lihat data get detail payroll yang telah diproses oleh Finance beserta rincian slip gajinya.",
      href: "/hr/payroll/details",
      icon: Receipt,
      badge: "Get Data Detail",
      color: "teal",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
          Dashboard Penggajian (Payroll HR)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pusat manajemen kompensasi, alokasi tunjangan & potongan, dan monitoring detail payroll karyawan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    card.color === "emerald"
                      ? "bg-emerald-50 text-emerald-600"
                      : card.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-teal-50 text-teal-600"
                  }`}
                >
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {card.badge}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 font-heading group-hover:text-emerald-700 transition-colors">
                {card.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Buka Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
