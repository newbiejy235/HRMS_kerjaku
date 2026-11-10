"use client";

import { useEffect, useState } from "react";
import { PlaceholderLayout } from "../../components/layout/PlaceholderLayout";
import {
  User,
  Building2,
  Phone,
  Mail,
  IdCard,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  dashboardService,
  EmployeeProfile,
  TelegramPairingResult,
} from "../../lib/services/dashboardService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
export default function ProfilPage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [telegramConnected, setTelegramConnected] = useState<boolean | null>(
    null,
  );
  const [telegramPairing, setTelegramPairing] =
    useState<TelegramPairingResult | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [showPairingDialog, setShowPairingDialog] = useState(false);

  useEffect(() => {
    loadProfile();
    checkTelegramStatus();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await dashboardService.getProfile();
      setProfile(data);
    } catch {
      setErrorMsg("Data profil belum bisa dimuat");
    } finally {
      setIsLoading(false);
    }
  };

  const checkTelegramStatus = async () => {
    try {
      const res = await dashboardService.getTelegramStatus();
      setTelegramConnected(res.connected);
    } catch {
      setTelegramConnected(null);
    }
  };

  const handleCreatePairing = async () => {
    setTelegramLoading(true);
    try {
      const res = await dashboardService.createTelegramPairing();
      setTelegramPairing(res);
      setShowPairingDialog(true);
    } catch {
      // error handled via UI state
    } finally {
      setTelegramLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PlaceholderLayout
        title="Profil Saya"
        subtitle="Informasi pribadi dan akun karyawan"
        badge="Info Pribadi"
      >
        <div className="flex-1 flex flex-col justify-center items-center space-y-3">
          <div className="h-4 bg-neutral-200/60 rounded-full w-24 animate-pulse" />
          <div className="h-4 bg-neutral-200/60 rounded-full w-32 animate-pulse" />
          <div className="h-4 bg-neutral-200/60 rounded-full w-48 animate-pulse" />
        </div>
      </PlaceholderLayout>
    );
  }

  if (errorMsg && !profile) {
    return (
      <PlaceholderLayout
        title="Profil Saya"
        subtitle="Informasi pribadi dan akun karyawan"
        badge="Info Pribadi"
      >
        <div className="flex-1 flex flex-col justify-center items-center space-y-3 text-center p-6">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-neutral-200 flex items-center justify-center mx-auto">
            <User className="w-5 h-5 text-neutral-600" />
          </div>
          <h2 className="text-base font-extrabold text-neutral-900">
            {errorMsg}
          </h2>
          <button
            type="button"
            onClick={loadProfile}
            className="py-2.5 px-5 rounded-full bg-neutral-900 text-white font-bold text-sm border-2 border-neutral-900 active:scale-[0.98]"
          >
            Coba lagi
          </button>
        </div>
      </PlaceholderLayout>
    );
  }

  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    : "-";

  return (
    <PlaceholderLayout
      title="Profil Saya"
      subtitle="Informasi pribadi dan akun karyawan"
      badge="Info Pribadi"
    >
      <div className="flex-1 flex flex-col space-y-4">
        {/* Profile Card */}
        {profile && (
          <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[2px_2px_0px_0px_#171717]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-900 bg-neutral-200 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-neutral-600 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-extrabold text-neutral-900 truncate">
                  {fullName}
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium truncate">
                  {profile.email}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mt-1">
                  {profile.position}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-white flex items-center justify-center text-neutral-900">
                <IdCard className="w-5 h-5 stroke-[2]" />
              </div>
            </div>

            <div className="flex flex-col space-y-5">
              <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 flex items-center gap-3 shadow-[2px_2px_0px_0px_#171717]">
                <Phone className="w-5 h-5 text-neutral-900 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Nomor Telepon
                  </p>
                  <p className="text-sm font-black text-neutral-900 truncate">
                    {profile.noTelp || "-"}
                  </p>
                </div>
              </div>
              <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 flex items-center gap-3 shadow-[2px_2px_0px_0px_#171717]">
                <Mail className="w-5 h-5 text-neutral-900 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Email Akun
                  </p>
                  <p className="text-sm font-black text-neutral-900 truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 flex items-center gap-3 shadow-[2px_2px_0px_0px_#171717]">
                <Clock className="w-5 h-5 text-neutral-900 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Tanggal Bergabung
                  </p>
                  <p className="text-sm font-black text-neutral-900">
                    {profile.hireDate || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Telegram Connection Section */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[2px_2px_0px_0px_#171717]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
              Koneksi Telegram
            </h3>
            {telegramConnected === null ? (
              <span className="text-[10px] text-neutral-400 font-medium">
                Memuat…
              </span>
            ) : telegramConnected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border-2 border-neutral-900">
                Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border-2 border-neutral-900">
                Belum Terhubung
              </span>
            )}
          </div>

          {telegramPairing &&
          telegramPairing.telegramUrl &&
          !telegramConnected ? (
            <div className="space-y-3">
              <div className="p-3 bg-[#FAF7F2] border border-neutral-300 rounded-2xl text-xs text-neutral-700 leading-relaxed">
                <p className="font-bold text-neutral-900 mb-1">
                  Buka Telegram untuk menyambungkan:
                </p>
                <a
                  href={telegramPairing.telegramUrl}
                  className="block w-full py-2.5 px-3 rounded-full bg-neutral-900 text-white font-bold text-center text-sm border-2 border-neutral-900 active:scale-[0.98] transition-transform"
                  rel="noreferrer"
                >
                  Buka Bot Telegram Kerjaku
                </a>
                <p className="text-[10px] text-neutral-500 mt-2">
                  Setelah membuka bot, ketik /start dengan kode pairing yang
                  muncul.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTelegramPairing(null);
                  checkTelegramStatus();
                }}
                className="w-full py-3 px-4 rounded-full font-bold text-sm bg-neutral-900 text-white border-2 border-neutral-900 active:scale-[0.98] transition-transform"
              >
                Saya Sudah Hubungkan
              </button>
            </div>
          ) : null}

          {telegramConnected ? (
            <p className="text-xs text-neutral-600 text-center">
              Notifikasi jadwal, pengajuan, dan slip gaji akan dikirim ke
              Telegram kamu.
            </p>
          ) : !telegramPairing ? (
            <button
              type="button"
              onClick={handleCreatePairing}
              disabled={telegramLoading}
              className="w-full py-3 px-4 rounded-full font-bold text-sm bg-neutral-900 text-white border-2 border-neutral-900 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {telegramLoading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white rounded-full border-t-transparent mr-2"></span>
                  Menyambungkan…
                </>
              ) : (
                <>Hubungkan Telegram</>
              )}
            </button>
          ) : null}
        </div>

        <div className="p-4 bg-[#F4EFE6] border-2 border-neutral-900 rounded-2xl text-[11px] text-neutral-700 leading-relaxed">
          <p className="font-bold text-neutral-900 mb-1">
            Data profil akan diperbarui dari sistem HR setelah integrasi API.
          </p>
          Halaman ini menampilkan data pribadi karyawan. Edit profil dan fitur
          lain akan tersedia dalam versi mendatang.
        </div>
      </div>
    </PlaceholderLayout>
  );
}
