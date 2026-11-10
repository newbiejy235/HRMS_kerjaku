import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kerjaku - Portal Karyawan F&B",
  description: "Aplikasi absensi, shift, dan manajemen kerja karyawan F&B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kerjaku",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="font-sans antialiased bg-[#FAF7F2] text-neutral-900 select-none">
        {children}
      </body>
    </html>
  );
}
