import { Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../config/db";
import { attendanceLocation } from "../../config/schema";
import { AuthRequest } from "../../middleware/users.middleware";

// CREATE LOCATION
export const createAttendanceLocation = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sesi tidak valid",
      });
    }

    if (req.user?.role !== "HR") {
      return res.status(403).json({
        success: false,
        message: "Hanya HR yang dapat mengatur lokasi absensi",
      });
    }

    const {
      locationName,
      latitude,
      longitude,
      radiusMeter,
    } = req.body;

    if (
      typeof locationName !== "string" ||
      !locationName.trim() ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof radiusMeter !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isInteger(radiusMeter) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      radiusMeter <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Data lokasi tidak valid",
      });
    }

    // Pastikan hanya ada satu lokasi perusahaan
    const [existing] = await db
      .select()
      .from(attendanceLocation)
      .limit(1);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Lokasi perusahaan sudah tersedia. Gunakan update.",
      });
    }

    const [newLocation] = await db
      .insert(attendanceLocation)
      .values({
        locationName: locationName.trim(),
        latitude,
        longitude,
        radiusMeter,
        isActive: true,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Lokasi absensi berhasil ditambahkan",
      data: newLocation,
    });
  } catch (error) {
    console.error("Create Attendance Location Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

// GET LOCATION
export const getAttendanceLocation = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sesi tidak valid",
      });
    }

    const [location] = await db
      .select()
      .from(attendanceLocation)
      .limit(1);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Lokasi absensi belum dikonfigurasi",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil lokasi absensi",
      data: location,
    });
  } catch (error) {
    console.error("Get Attendance Location Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

// UPDATE LOCATION
export const updateAttendanceLocation = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sesi tidak valid",
      });
    }

    if (req.user?.role !== "HR") {
      return res.status(403).json({
        success: false,
        message: "Hanya HR yang dapat mengubah lokasi absensi",
      });
    }

    const locationId = Number(req.params.id);

    if (!Number.isSafeInteger(locationId) || locationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID lokasi tidak valid",
      });
    }

    const {
      locationName,
      latitude,
      longitude,
      radiusMeter,
    } = req.body;

    if (
      locationName === undefined &&
      latitude === undefined &&
      longitude === undefined &&
      radiusMeter === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimal satu data harus dikirim",
      });
    }

    if (
      locationName !== undefined &&
      (typeof locationName !== "string" || !locationName.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Nama lokasi tidak valid",
      });
    }

    if (
      latitude !== undefined &&
      (typeof latitude !== "number" ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude tidak valid",
      });
    }

    if (
      longitude !== undefined &&
      (typeof longitude !== "number" ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude tidak valid",
      });
    }

    if (
      radiusMeter !== undefined &&
      (typeof radiusMeter !== "number" ||
        !Number.isInteger(radiusMeter) ||
        radiusMeter <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Radius harus berupa bilangan bulat positif",
      });
    }

    const [existing] = await db
      .select()
      .from(attendanceLocation)
      .where(eq(attendanceLocation.id, locationId));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lokasi absensi tidak ditemukan",
      });
    }

    const [updatedLocation] = await db
      .update(attendanceLocation)
      .set({
        ...(locationName !== undefined && {
          locationName: locationName.trim(),
        }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(radiusMeter !== undefined && { radiusMeter }),
      })
      .where(eq(attendanceLocation.id, locationId))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Lokasi absensi berhasil diperbarui",
      data: updatedLocation,
    });
  } catch (error) {
    console.error("Update Attendance Location Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

// UPDATE LOCATION STATUS
export const updateAttendanceLocationStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sesi tidak valid",
      });
    }

    if (req.user?.role !== "HR") {
      return res.status(403).json({
        success: false,
        message: "Hanya HR yang dapat mengubah status lokasi",
      });
    }

    const locationId = Number(req.params.id);
    const { isActive } = req.body;

    if (!Number.isSafeInteger(locationId) || locationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID lokasi tidak valid",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status lokasi harus berupa boolean",
      });
    }

    const [existing] = await db
      .select()
      .from(attendanceLocation)
      .where(eq(attendanceLocation.id, locationId));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lokasi absensi tidak ditemukan",
      });
    }

    const [updated] = await db
      .update(attendanceLocation)
      .set({ isActive })
      .where(eq(attendanceLocation.id, locationId))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Status lokasi berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("Update Attendance Location Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};