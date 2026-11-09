const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Bungkus response.json() agar tidak melempar "Unexpected token '<', <!DOCTYPE..."
  // jika backend mengembalikan HTML (misal error 404, 500, atau redirect).
  response.json = async () => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      if (response.status === 401) {
        throw new Error("Sesi login telah berakhir atau tidak valid. Silakan login kembali.");
      }
      if (response.status === 403) {
        throw new Error("Anda tidak memiliki izin (akses HR dibutuhkan) untuk aksi ini.");
      }
      if (response.status === 404) {
        throw new Error(`Endpoint tidak ditemukan (404): ${endpoint}. Pastikan server backend aktif di ${API_URL}.`);
      }
      if (text.startsWith("<!DOCTYPE") || text.includes("<html")) {
        throw new Error(
          `Server mengembalikan halaman HTML (${response.status} ${response.statusText}) bukan data JSON. Pastikan backend aktif di ${API_URL}.`
        );
      }
      throw new Error(text || `Gagal membaca respon server (${response.status}).`);
    }
  };

  return response;
}
