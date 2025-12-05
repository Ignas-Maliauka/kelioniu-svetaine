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

// --- Friends endpoints ---
// GET /api/users/:id/friends  - list friends of a user
router.get('/:id/friends', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('friends', '-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.friends || []);
  } catch (err) {
    console.error('GET /api/users/:id/friends error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/:id/friends  - add friend (mutual)
router.post('/:id/friends', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.userId;
    if (targetId === meId) return res.status(400).json({ message: "Can't add yourself as friend" });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'Target user not found' });

    // check if already friends
    const already = target.friends && target.friends.some((f) => f.equals(meId));
    if (already) return res.status(400).json({ message: 'Already friends' });

    // add to both users' friends lists
    await User.findByIdAndUpdate(meId, { $addToSet: { friends: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { friends: meId } });

    const updated = await User.findById(meId).populate('friends', '-password');
    res.status(201).json(updated.friends || []);
  } catch (err) {
    console.error('POST /api/users/:id/friends error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id/friends - remove friend (mutual)
router.delete('/:id/friends', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.userId;
    if (targetId === meId) return res.status(400).json({ message: "Can't remove yourself" });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'Target user not found' });

    await User.findByIdAndUpdate(meId, { $pull: { friends: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { friends: meId } });

    const updated = await User.findById(meId).populate('friends', '-password');
    res.json(updated.friends || []);
  } catch (err) {
    console.error('DELETE /api/users/:id/friends error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
