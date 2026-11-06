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