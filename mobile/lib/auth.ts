/**
 * Authentication storage and session management.
 * Designed to persist session when the app/WebView is closed and reopened.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "Karyawan" | "HR" | "Finance";
  position: string;
  outlet: string;
  avatarUrl?: string;
}

const TOKEN_KEY = "kerjaku_token";
const USER_KEY = "kerjaku_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function isEmployee(): boolean {
  const user = getUser();
  return user?.role === "Karyawan";
}
