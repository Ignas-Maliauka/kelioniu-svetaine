import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.ATLAS_URI;
  if (!uri) throw new Error("ATLAS_URI not set");

  try {
    await mongoose.connect(uri, {
      // serverSelectionTimeoutMS can be kept to control how long to try selecting a server
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}