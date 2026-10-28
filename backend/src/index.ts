import express from "express";
import auth from "../src/routes/auth.route";
import verification from "./routes/forgetVerification.routes";
import employeeData from "./routes/profile.routes";
import cors from "cors";
import "../src/lib/telegram/telegram.handler";
import activationBot from "../src/routes/activation.route";

const app = express();
const PORT = 8000;

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

app.use("/auth", auth);
app.use("/verification", verification);
app.use("/data", employeeData);
app.use("/activation", activationBot);

app.get("/", (req, res) => {
  res.send("Hello Express + TypeScript!");
});

app.get("/tes", (req, res) => {
  res.send("Hello Express + TypeScript! 2222222");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
