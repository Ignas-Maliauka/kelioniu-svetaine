import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kelioniu_svetaine";

  try {
    await mongoose.connect(uri, {
      // short timeout so local/failing connections surface quickly in dev
      serverSelectionTimeoutMS: 5000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected to:", uri);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}