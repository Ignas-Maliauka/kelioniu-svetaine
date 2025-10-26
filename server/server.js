import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import express from "express";
import cors from "cors";
import connectDB from "./db/connection.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();