import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const heading = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-heading",
  display: "swap"
});

const body = Inter({ 
  subsets: ["latin"], 
  variable: "--font-body",
  display: "swap"
});

export const metadata = {
  title: "KerjaKu - HRIS & Payroll",
  description: "Sistem manajemen kehadiran dan penggajian karyawan F&B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}