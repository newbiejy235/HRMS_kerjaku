import express from "express";
import auth from "../src/routes/auth.route";
import verification from "./routes/forgetVerification.routes";
import employeeData from "./routes/profile.routes";
import cors from "cors";
import "../src/lib/telegram/telegram.handler";
import activationBot from "../src/routes/activation.route";
import manageEmployees from "../src/routes/manageEmployee.routes";
import QRgenerate from "../src/routes/attendance.route";
import aiAnalisis from "../src/routes/reportAi.route";
import employeePermission from "../src/routes/permission.routes";
import financeRoutes from "./routes/finance.routes";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./lib/documentation_api/swagger";

const app = express();
const PORT = 8000;

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());



// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", auth);
app.use("/verification", verification);
app.use("/data", employeeData);
app.use("/activation", activationBot);
app.use("/manage", manageEmployees);
app.use("/attendance", QRgenerate);
app.use("/report-analyst", aiAnalisis);
app.use("/permission", employeePermission);
app.use("/finance", financeRoutes);

app.get("/", (req, res) => {
  res.send("Hello Express + TypeScript!");
});

app.get("/tes", (req, res) => {
  res.send("Hello Express + TypeScript! 2222222");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
