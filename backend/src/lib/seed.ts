import { db } from "../config/db";
import { attendanceSettings } from "../config/schema";

type ShiftCategory = "Morning" | "Afternoon" | "Evening";

interface Settings {
  category: ShiftCategory;
  normal_time_in: string;
  normal_time_out: string;
}

const settingsShift = async (
  category: ShiftCategory,
  timeIn: string,
  timeOut: string,
): Promise<Settings> => {
  try {
    const insert = await db.insert(attendanceSettings).values({
      category: category,
      normal_time_in: timeIn,
      normal_time_out: timeOut,
    });

    console.log("jadwal berhasil dimasukan");
    return {
      category,
      normal_time_in: timeIn,
      normal_time_out: timeOut,
    };
  } catch (error) {
    console.log(error);
    return {
      category,
      normal_time_in: timeIn,
      normal_time_out: timeOut,
    };
  }
};

settingsShift("Evening", "23:00:00", "07:00:00");
settingsShift("Afternoon", "15:00:00", "23:00:00");
settingsShift("Morning", "07:00:00", "15:00:00");
