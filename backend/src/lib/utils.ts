import dotenv from "dotenv";

dotenv.config();

export const toCents = (amount: string): bigint => {
  const [integer, decimal = ""] = amount.split(".");

  const paddedDecimal = decimal.padEnd(2, "0").slice(0, 2);

  return BigInt(integer) * 100n + BigInt(paddedDecimal);
};

// Mengubah satuan sen kembali menjadi decimal string
export const fromCents = (amount: bigint): string => {
  const integer = amount / 100n;
  const decimal = (amount % 100n).toString().padStart(2, "0");

  return `${integer}.${decimal}`;
};

export const DEFAULT_EFFECTIVE_DAYS = Number(
  process.env.HARI_EFEKTIF_KERJA ?? 21,
);

// Format Date menjadi YYYY-MM-DD menggunakan waktu lokal.
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getPeriod = (month: number, year: number) => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

  const lastDay = new Date(year, month, 0).getDate();

  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const today = formatDate(new Date());

  // Bulan berjalan hanya dihitung sampai hari ini.
  const effectiveEndDate = endDate > today ? today : endDate;

  return {
    startDate,
    endDate,
    effectiveEndDate,
  };
};
