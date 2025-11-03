import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import express from "express";
import cors from "cors";
import connectDB from "./db/connection.js";
import authRoutes from "./routes/auth.js";
import eventsRoutes from "./routes/events.js";
import activitiesRoutes from "./routes/activities.js";
import planningRoutes from "./routes/planningSteps.js";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow tools like Insomnia
      const allowed = ["http://localhost:5173", "http://localhost:5174"];
      cb(null, allowed.includes(origin));
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/planning-steps", planningRoutes);

const PORT = process.env.PORT || 5050;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();