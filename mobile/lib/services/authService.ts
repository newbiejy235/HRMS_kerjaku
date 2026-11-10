import { AuthUser, setSession } from "../auth";

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface ForgetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authService = {
  validateEmail(email: string): string | null {
    if (!email || !email.trim()) {
      return "Email belum diisi";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Format email belum benar";
    }
    return null;
  },

  validatePassword(password: string): string | null {
    if (!password) {
      return "Password belum diisi";
    }
    if (password.length < 6) {
      return "Password minimal 6 karakter";
    }
    return null;
  },

  async login(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();


    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.message || "Email atau password salah, coba cek lagi",
        };
      }

      if (data.userData?.role !== "Karyawan") {
        return {
          success: false,
          error: `Akun ini adalah ${data.userData?.role}. Silakan masuk melalui portal web HR/Finance.`,
        };
      }

      const user: AuthUser = {
        id: String(data.userData.id || "emp-1"),
        name: data.userData.name || "Karyawan",
        email: data.userData.email,
        role: data.userData.role,
        position: data.userData.position || "Staf Outlet",
        outlet: data.userData.outlet || "Outlet Utama",
      };

      setSession(data.userData.token, user);
      return { success: true, user };
    } catch {
      return {
        success: false,
        error: "Koneksi bermasalah, coba lagi",
      };
    }
  },

  async forgetPassword(email: string): Promise<ForgetPasswordResult> {
    const cleanEmail = email.trim().toLowerCase();

    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        success: true,
        message: "Jika email terdaftar, link reset akan dikirim.",
      };
    }

    try {
      const res = await fetch(`${API_URL}/auth/forget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.message || "Gagal mengirim permintaan reset password",
        };
      }

      return {
        success: true,
        message: data.message || "Jika email terdaftar, link reset akan dikirim.",
      };
    } catch {
      return {
        success: false,
        error: "Koneksi bermasalah, coba lagi",
      };
    }
  },

  async resetPassword(token: string, password: string): Promise<ResetPasswordResult> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        success: true,
        message: "Password berhasil diubah. Silakan masuk kembali.",
      };
    }

    try {
      const res = await fetch(`${API_URL}/auth/reset-with-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.message || "Gagal mengubah password",
        };
      }

      return {
        success: true,
        message: data.message || "Password berhasil diubah. Silakan masuk kembali.",
      };
    } catch {
      return {
        success: false,
        error: "Koneksi bermasalah, coba lagi",
      };
    }
  },
};
