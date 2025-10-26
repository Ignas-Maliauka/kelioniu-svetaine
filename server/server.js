import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import records from "./routes/record.js";

dotenv.config();

const app = express();

// parse JSON bodies
app.use(express.json());

// enable CORS for your client (adjust origin if needed)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// mount auth
app.use("/api/auth", authRoutes);
app.use("/record", records);

// start the Express server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});