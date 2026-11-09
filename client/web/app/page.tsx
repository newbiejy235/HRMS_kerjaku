"use client";
import { redirect } from "next/navigation";

export default function Home() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token && role === "HR") {
    redirect("/hr/dashboard");
  }

  if (token && role === "Finance") {
    redirect("/finance/dashboard");
  }
  redirect("/login");
}
