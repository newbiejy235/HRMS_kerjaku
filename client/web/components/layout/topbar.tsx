"use client";

import { Menu, Search, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  onMenuClick: () => void;
  role: "hr" | "finance";
}

export function Topbar({ onMenuClick, role }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white/80 px-4 backdrop-blur-sm lg:px-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </Button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder={role === "hr" ? "Cari karyawan atau shift..." : "Cari data penggajian..."}
            className="h-9 w-64 rounded-lg border border-border bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-colors" // <-- Ubah fokus ring
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-500 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-600 border border-white" />
        </Button>
        
        <div className="h-8 w-px bg-border mx-1" />
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium leading-none text-slate-900">
              {role === "hr" ? "Rina Wijaya" : "Andi Pratama"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {role === "hr" ? "HR Manager" : "Finance Staff"}
            </p>
          </div>
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-emerald-50 text-emerald-800 text-xs font-medium"> {/* <-- Ubah Avatar BG */}
              {role === "hr" ? "RW" : "AP"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}