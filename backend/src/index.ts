import express from "express";
import auth from "../src/routes/auth.route";

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello Express + TypeScript!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
