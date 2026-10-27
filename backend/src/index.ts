import express from "express";
import auth from "../src/routes/auth.route";
import cors from "cors"

const app = express();
const PORT = 5000;

app.use(cors({
  origin : "*"
}))
app.use(express.json());

app.use("/auth", auth)

app.get("/", (_req, res) => {
  res.send("Hello Express + TypeScript!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
