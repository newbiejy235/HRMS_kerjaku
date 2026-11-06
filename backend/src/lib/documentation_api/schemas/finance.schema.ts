export const financeSchemas: Record<string, any> = {
  PayrollComponentRequest: {
    type: "object",
    required: ["componentName", "type"],
    properties: {
      componentName: { type: "string", minLength: 3, maxLength: 100 },
      description: { type: "string", maxLength: 500, nullable: true },
      type: { type: "string", enum: ["earning", "deduction"] },
    },
  },
  UpdatePayrollComponentRequest: {
    type: "object",
    properties: {
      componentName: { type: "string", minLength: 3, maxLength: 100 },
      description: { type: "string", maxLength: 500, nullable: true },
      type: { type: "string", enum: ["earning", "deduction"] },
    },
  },
  PayrollAllocationRequest: {
    type: "object",
    required: ["componentId", "employeeId", "amount"],
    properties: {
      componentId: { type: "integer", minimum: 1 },
      employeeId: { type: "string", minLength: 1, maxLength: 30 },
      amount: { type: "number", minimum: 0.01, maximum: 9999999999999.99 },
    },
  },
  UpdatePayrollAllocationRequest: {
    type: "object",
    required: ["amount"],
    properties: {
      amount: { type: "number", minimum: 0.01, maximum: 9999999999999.99 },
    },
  },
  GeneratePayrollRequest: {
    type: "object",
    required: ["employeeId", "payrollPeriod"],
    properties: {
      employeeId: { type: "string", minLength: 1, maxLength: 30 },
      payrollPeriod: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
    },
  },
};
