import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { cities, provinces } from "../../config/schema";
import { Request, Response } from "express";

export const getAllCities = async (req: Request, res: Response) => {
  try {
    const query = await db
      .select({
        id: cities.id,
        kota: cities.kota,
        provinsi: provinces.provinsi,
      })
      .from(cities)
      .innerJoin(provinces, eq(cities.provinsi_id, provinces.id));
    return res.status(200).json({
      success: true,
      message: "berhasil ambil data",
      data: {
        query,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
