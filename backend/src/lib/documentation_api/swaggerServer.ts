import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger";

const app = express();
const PORT = 8001;

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`Swagger UI running on http://localhost:${PORT}/api-docs`);
});
