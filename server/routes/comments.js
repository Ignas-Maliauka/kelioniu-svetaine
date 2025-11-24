import express from "express";
import Comment from "../models/Comment.js";
import Event from "../models/Event.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// read access: organisers, owner or participants may view comments
async function userHasReadAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { organisers: userId }, { participants: userId }] });
  return !!ev;
}

// write access: only organisers (including owner) may create comments
async function userHasWriteAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { organisers: userId }] });
  return !!ev;
}

// GET /api/comments?event=<id>
router.get("/", requireAuth, async (req, res) => {
  try {
    const { event } = req.query;
    if (!event) return res.status(400).json({ message: "Event id is required" });
    const ok = await userHasReadAccessToEvent(event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    // pagination support: ?page=1&limit=5
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (limit > 0) {
      const total = await Comment.countDocuments({ event });
      const pg = Math.max(1, page || 1);
      const skip = (pg - 1) * limit;
      const comments = await Comment.find({ event })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "-password");
      return res.json({ comments, total });
    }

    // newest first, no pagination
    const comments = await Comment.find({ event }).sort({ createdAt: -1 }).populate("author", "-password");
    res.json(comments);
  } catch (err) {
    console.error("GET /api/comments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/comments  - create comment (user must have access to event)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { event, content } = req.body || {};
    if (!event || !content) return res.status(400).json({ message: "Event and content are required" });
    if (typeof content !== "string" || content.trim().length === 0) return res.status(400).json({ message: "Content is required" });

    const ok = await userHasWriteAccessToEvent(event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const comment = await Comment.create({ event, author: req.userId, content: content.trim() });
    const populated = await Comment.findById(comment._id).populate("author", "-password");
    res.status(201).json(populated);
  } catch (err) {
    console.error("POST /api/comments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/comments/:id - delete a comment if you're the author or the event organiser
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    const ev = await Event.findById(c.event);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    const isAuthor = c.author.equals(req.userId);
    // only the event owner (ev.organiser) may delete others' comments
    const isOwner = ev.organiser.equals(req.userId);
    if (!isAuthor && !isOwner) return res.status(403).json({ message: "Forbidden" });

    await c.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("DELETE /api/comments/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
