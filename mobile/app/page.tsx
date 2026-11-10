"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isEmployee } from "../lib/auth";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated() && isEmployee()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#FAF7F2]">
      <div className="w-8 h-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
    </div>
  );
}
