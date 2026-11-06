export const employeeSchemas: Record<string, any> = {
  EmployeeProfileData: {
    type: "object",
    properties: {
      employeeId: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string", nullable: true },
      gender: { type: "string", enum: ["L", "P"] },
      noTelp: { type: "string", nullable: true },
      hireDate: { type: "string", format: "date" },
      employmentStatus: { type: "string", enum: ["active", "fired"] },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["Karyawan", "Finance", "HR"] },
    },
  },
  ManageEmployeeUpdateRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      firstName: { type: "string", minLength: 1, maxLength: 255 },
      lastName: { type: "string", maxLength: 255, nullable: true },
      gender: { type: "string", enum: ["L", "P"] },
      noTelp: { type: "string", minLength: 10, maxLength: 13, pattern: "^[0-9]+$" },
      noRek: { type: "string", minLength: 10, maxLength: 100 },
      cities_id: { type: "integer", minimum: 1 },
      idPosition: { type: "integer", minimum: 1 },
      idDepartment: { type: "integer", minimum: 1 },
    },
  },
  ShiftSettingsUpdateRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      normal_time_in: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$" },
      normal_time_out: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$" },
      tolerance_time: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$" },
    },
  },
  CreateShiftScheduleRequest: {
    type: "object",
    required: ["shiftDate", "shiftTime", "upcomingShiftDate", "upcomingShiftTime", "id_employee"],
    additionalProperties: false,
    properties: {
      shiftDate: { type: "string", format: "date" },
      shiftTime: { type: "integer", minimum: 1 },
      upcomingShiftDate: { type: "string", format: "date" },
      upcomingShiftTime: { type: "integer", minimum: 1 },
      employeeLocate: { type: "string", maxLength: 1000, nullable: true },
      id_employee: { type: "string", minLength: 1, maxLength: 30 },
    },
  },
  UpdateShiftScheduleRequest: {
    type: "object",
    additionalProperties: false,
    properties: {
      shiftDate: { type: "string", format: "date" },
      shiftTime: { type: "integer", minimum: 1 },
      upcomingShiftDate: { type: "string", format: "date" },
      upcomingShiftTime: { type: "integer", minimum: 1 },
      employeeLocate: { type: "string", maxLength: 1000, nullable: true },
    },
  },
  ActivationRequest: {
    type: "object",
    required: ["telegramUserId"],
    properties: {
      telegramUserId: { type: "string", minLength: 1 },
    },
  },
  PermissionRequest: {
    type: "object",
    required: ["permit_type", "start_date", "end_date"],
    properties: {
      permit_type: { type: "string", enum: ["permission", "sick", "holiday"] },
      permit_reason: { type: "string" },
      start_date: { type: "string", format: "date" },
      end_date: { type: "string", format: "date" },
    },
  },
  OvertimeRequest: {
    type: "object",
    required: ["overtimeDate", "overtimeTotal"],
    properties: {
      overtimeDate: { type: "string", format: "date-time" },
      overtimeTotal: { type: "integer", minimum: 1 },
      description: { type: "string" },
    },
  },
  HRPermissionResponseRequest: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["pending", "rejected", "accepted"] },
      id_permission: { type: "integer" },
    },
  },
  HROvertimeResponseRequest: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["pending", "rejected", "accepted"] },
      id_overtime: { type: "integer" },
    },
  },
  HROvertimeRequest: {
    type: "object",
    required: ["id_employee", "overtimeDate", "overtimeTotal"],
    properties: {
      id_employee: { type: "string", minLength: 1, maxLength: 30 },
      overtimeDate: { type: "string", format: "date-time" },
      overtimeTotal: { type: "integer", minimum: 1 },
      description: { type: "string" },
    },
  },
  AttendanceLocationRequest: {
    type: "object",
    required: ["locationName", "latitude", "longitude", "radiusMeter"],
    properties: {
      locationName: { type: "string", minLength: 1 },
      latitude: { type: "number", minimum: -90, maximum: 90 },
      longitude: { type: "number", minimum: -180, maximum: 180 },
      radiusMeter: { type: "integer", minimum: 1 },
    },
  },
  UpdateAttendanceLocationRequest: {
    type: "object",
    properties: {
      locationName: { type: "string", minLength: 1 },
      latitude: { type: "number", minimum: -90, maximum: 90 },
      longitude: { type: "number", minimum: -180, maximum: 180 },
      radiusMeter: { type: "integer", minimum: 1 },
    },
  },
  AttendanceLocationStatusRequest: {
    type: "object",
    required: ["isActive"],
    properties: {
      isActive: { type: "boolean" },
    },
  },
  ReimbursementReviewRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["approved", "rejected"] },
      rejectionReason: { type: "string" },
    },
  },
};
