import express from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users/search?q=...  - search users by name or email (requires auth)
router.get("/search", requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ message: "Query is required" });

    // escape regex special chars
    const esc = q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const re = new RegExp(esc, "i");

    const users = await User.find({ $or: [{ name: re }, { email: re }] })
      .limit(10)
      .select("-password");

    res.json(users);
  } catch (err) {
    console.error("GET /api/users/search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
