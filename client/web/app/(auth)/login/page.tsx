"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, Eye, EyeOff, Wallet, type LucideIcon } from "lucide-react";

type Field = "email" | "password";
type Jenis = "kaca" | "terang" | "tegas";

type KartuPanel = {
  jenis: Jenis;
  label?: string;
  nilai?: string;
  ket?: string;
  ikon?: LucideIcon;
  titik?: "atas" | "bawah";
};

const jalurPutar = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 1],
  [1, 0],
] as const;

const kartuPanel: KartuPanel[] = [
  { jenis: "tegas", label: "Hadir hari ini", nilai: "42 dari 48", ket: "Shift pagi dan siang", ikon: BadgeCheck },
  { jenis: "kaca" },
  { jenis: "tegas", label: "Periode gaji", nilai: "Oktober 2026", ket: "Menunggu Finance", ikon: Wallet },
  { jenis: "terang", label: "Lembur bulan ini", nilai: "18,5 jam", ket: "Dari 6 karyawan", titik: "bawah" },
  { jenis: "kaca" },
  { jenis: "terang", label: "Terlambat", nilai: "5 karyawan", ket: "Toleransi 10 menit", titik: "atas" },
];

const LAPISAN: Record<Jenis, number> = { terang: 1, kaca: 2, tegas: 3 };
const INTERVAL_MS = 3000;
const JARAK = "calc(var(--s) + var(--g))";

function validasi(field: Field, nilai: string) {
  if (field === "email") {
    if (!nilai) return "Email wajib diisi";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nilai)) return "Format email tidak valid";
  }
  if (field === "password" && !nilai) return "Kata sandi wajib diisi";
  return "";
}

async function simulasiLogin(email: string): Promise<{ tujuan?: string; galat?: string }> {
  await new Promise((r) => setTimeout(r, 900));
  const e = email.toLowerCase();
  if (e.includes("hr")) return { tujuan: "/hr/dashboard" };
  if (e.includes("finance")) return { tujuan: "/finance/dashboard" };
  if (e.includes("employee")) return { galat: "Akun tidak memiliki akses ke aplikasi web" };
  return { galat: "Email atau kata sandi salah" };
}

function Kartu({ data, indeks, langkah }: { data: KartuPanel; indeks: number; langkah: number }) {
  const [kolom, baris] = jalurPutar[(indeks + langkah) % jalurPutar.length];
  const Ikon = data.ikon;
  const gaya: Record<Jenis, string> = {
    kaca: "bg-white/25 backdrop-blur-sm",
    terang: "bg-emerald-100 text-slate-900",
    tegas: "bg-emerald-700 text-white",
  };

  return (
    <div
      className={`absolute left-0 top-0 flex flex-col justify-between overflow-hidden transition-transform duration-[650ms] ease-[cubic-bezier(0.6,0,0.3,1)] motion-reduce:transition-none ${gaya[data.jenis]}`}
      style={{
        width: "var(--s)",
        height: "var(--s)",
        padding: "calc(var(--s) * 0.1)",
        borderRadius: "calc(var(--s) * 0.09)",
        zIndex: LAPISAN[data.jenis],
        transitionDelay: `${indeks * 60}ms`,
        transform: `translate(calc(${kolom} * ${JARAK}), calc(${baris} * ${JARAK}))`,
      }}
    >
      {data.titik && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 ${data.titik === "atas" ? "top-0" : "bottom-0"}`}
          style={{
            width: "62%",
            height: "40%",
            backgroundImage: "radial-gradient(circle, rgba(5,150,105,0.28) 1.4px, transparent 1.6px)",
            backgroundSize: "calc(var(--s) * 0.095) calc(var(--s) * 0.095)",
          }}
        />
      )}

      {Ikon ? (
        <span
          className="flex items-center justify-center rounded-full bg-white text-emerald-700"
          style={{ width: "calc(var(--s) * 0.2)", height: "calc(var(--s) * 0.2)" }}
        >
          <Ikon className="h-[58%] w-[58%]" />
        </span>
      ) : (
        <span />
      )}

      {data.label && (
        <div className="relative">
          <p className={data.jenis === "tegas" ? "text-white/85" : "text-slate-500"} style={{ fontSize: "max(11px, calc(var(--s) * 0.075))" }}>
            {data.label}
          </p>
          <p className="mt-1 font-heading font-semibold leading-tight tabular-nums" style={{ fontSize: "max(18px, calc(var(--s) * 0.135))" }}>
            {data.nilai}
          </p>
          <p className={`mt-1 ${data.jenis === "tegas" ? "text-white/85" : "text-slate-500"}`} style={{ fontSize: "max(11px, calc(var(--s) * 0.072))" }}>
            {data.ket}
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [nilai, setNilai] = useState({ email: "", password: "" });
  const [disentuh, setDisentuh] = useState({ email: false, password: false });
  const [sudahKirim, setSudahKirim] = useState(false);
  const [tampilSandi, setTampilSandi] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galatServer, setGalatServer] = useState("");
  const [langkah, setLangkah] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setLangkah((l) => l + 1), INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const galat = {
    email: validasi("email", nilai.email),
    password: validasi("password", nilai.password),
  };
  const tampilGalat = (f: Field) => (disentuh[f] || sudahKirim) && galat[f];

  const ubah = (f: Field, v: string) => {
    setNilai((prev) => ({ ...prev, [f]: v }));
    setGalatServer("");
  };

  const saatBlur = (f: Field) => {
    if (nilai[f] !== "") setDisentuh((prev) => ({ ...prev, [f]: true }));
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSudahKirim(true);
    if (galat.email || galat.password) return;

    setMemproses(true);
    setGalatServer("");
    const hasil = await simulasiLogin(nilai.email);
    if (hasil.tujuan) {
      router.push(hasil.tujuan);
      return;
    }
    setGalatServer(hasil.galat ?? "Tidak dapat terhubung ke server. Coba lagi.");
    setMemproses(false);
  };

  const kelasInput = (f: Field) =>
    `h-12 w-full rounded-lg border bg-white px-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 ${
      tampilGalat(f)
        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
        : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20"
    }`;

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-emerald-50 p-5 lg:block lg:overflow-hidden">
      <div className="relative lg:h-[calc(100dvh-40px)] w-full">
        
        <section
          aria-hidden="true"
          className="relative hidden h-full lg:w-[64.3%] overflow-hidden rounded-2xl bg-emerald-950 [container-type:size] lg:block"
        >
          <Image src="/images/image.png" alt="" fill priority sizes="(min-width: 1024px) 64vw, 0px" className="object-cover" />
          <div className="absolute inset-0 bg-emerald-950/60" />

          <div
            className="absolute inset-0 flex items-center justify-center pr-14"
            style={{
              ["--s" as string]: "clamp(170px, min(28cqh, 24cqw), 300px)",
              ["--g" as string]: "calc(var(--s) * 0.1)",
            }}
          >
            <div className="relative" style={{ width: "calc(2 * var(--s) + var(--g))", height: "calc(3 * var(--s) + 2 * var(--g))" }}>
              {kartuPanel.map((data, i) => (
                <Kartu key={i} data={data} indeks={i} langkah={langkah} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[520px] rounded-xl border border-emerald-600/60 bg-white p-12 shadow-[0_12px_32px_rgba(2,44,34,0.10)] lg:absolute lg:left-[64.3%] lg:-translate-x-[56px] lg:top-1/2 lg:mx-0 lg:-translate-y-1/2">
          
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-lg font-bold text-white">
              K
            </span>
            <span className="font-heading text-xl font-semibold text-slate-900">KerjaKu</span>
          </div>

          <div className="mb-10">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">Masuk</h1>
            <p className="mt-2 text-base text-slate-500">Khusus HR dan Finance.</p>
          </div>

          <form onSubmit={kirim} noValidate className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email kerja
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                value={nilai.email}
                onChange={(e) => ubah("email", e.target.value)}
                onBlur={() => saatBlur("email")}
                aria-invalid={Boolean(tampilGalat("email"))}
                aria-describedby={tampilGalat("email") ? "email-galat" : undefined}
                placeholder="nama@perusahaan.com"
                className={kelasInput("email")}
              />
              {tampilGalat("email") && (
                <p id="email-galat" className="mt-2 text-sm text-rose-600">
                  {galat.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={tampilSandi ? "text" : "password"}
                  autoComplete="current-password"
                  value={nilai.password}
                  onChange={(e) => ubah("password", e.target.value)}
                  onBlur={() => saatBlur("password")}
                  onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  aria-invalid={Boolean(tampilGalat("password"))}
                  aria-describedby={tampilGalat("password") ? "password-galat" : undefined}
                  className={`${kelasInput("password")} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setTampilSandi((v) => !v)}
                  aria-label={tampilSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                >
                  {tampilSandi ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {tampilGalat("password") && (
                <p id="password-galat" className="mt-2 text-sm text-rose-600">
                  {galat.password}
                </p>
              )}
              {capsLock && <p className="mt-2 text-sm text-amber-700">Caps Lock aktif</p>}
            </div>

            {galatServer && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {galatServer}
              </div>
            )}

            <button
              type="submit"
              disabled={memproses}
              className="h-12 w-full mt-4 rounded-lg bg-emerald-700 text-base font-medium text-white transition-colors hover:bg-emerald-800 active:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {memproses ? "Memproses..." : "Masuk"}
            </button>
          </form>

        </section>
      </div>

      <p className="absolute bottom-5 right-8 hidden text-xs text-slate-500 lg:block">KerjaKu v1.0 &middot; 2026</p>
    </main>
  );
}