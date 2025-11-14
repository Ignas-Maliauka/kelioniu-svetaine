import express from "express";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import PlanningStep from "../models/PlanningStep.js";
import Comment from "../models/Comment.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/events/  - events the user is related to
router.get("/", requireAuth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [{ organiser: req.userId }, { participants: req.userId }],
    })
      .sort({ createdAt: -1 })
      .populate("organiser", "-password")
      .populate("participants", "-password");
    // attach comment counts per event to avoid extra client requests
    try {
      const ids = events.map((e) => e._id);
      const counts = await Comment.aggregate([
        { $match: { event: { $in: ids } } },
        { $group: { _id: "$event", count: { $sum: 1 } } },
      ]);
      const map = {};
      counts.forEach((c) => (map[c._id.toString()] = c.count));
      const out = events.map((e) => {
        const obj = e.toObject ? e.toObject() : e;
        obj.commentCount = map[e._id.toString()] || 0;
        return obj;
      });
      res.json(out);
    } catch (err) {
      // if comment aggregation fails, still return events without counts
      console.error("Failed to aggregate comment counts:", err);
      res.json(events);
    }
  } catch (err) {
    console.error("GET /api/events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/events/  - create event (organiser = current user)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, participants = [] } = req.body || {};
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (title.length < 2 || title.length > 50) return res.status(400).json({ message: "Title must be 2-50 characters long" });
    if (description && description.length > 200) return res.status(400).json({ message: "Description too long (max 200)" });
    if (location && location.length > 50) return res.status(400).json({ message: "Location too long (max 50)" });

    const ev = await Event.create({
      title,
      description,
      startDate,
      endDate,
      location,
      organiser: req.userId,
      participants,
    });

    const populated = await Event.findById(ev._id).populate("organiser", "-password").populate("participants", "-password");
    res.status(201).json(populated);
  } catch (err) {
    console.error("POST /api/events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/events/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const ev = await Event.findOne({
      _id: req.params.id,
      $or: [{ organiser: req.userId }, { participants: req.userId }],
    })
      .populate("organiser", "-password")
      .populate("participants", "-password")
      .populate("activities")
      .populate("planningSteps");

    if (!ev) return res.status(404).json({ message: "Event not found or access denied" });
    res.json(ev);
  } catch (err) {
    console.error("GET /api/events/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/events/:id  - only organiser can update
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    if (!ev.organiser.equals(req.userId)) return res.status(403).json({ message: "Forbidden" });

    const updates = (({ title, description, startDate, endDate, location, participants }) => ({ title, description, startDate, endDate, location, participants }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    if (updates.title && (updates.title.length < 2 || updates.title.length > 50)) return res.status(400).json({ message: "Title must be 2-50 characters long" });
    if (updates.description && updates.description.length > 200) return res.status(400).json({ message: "Description too long (max 200)" });
    if (updates.location && updates.location.length > 50) return res.status(400).json({ message: "Location too long (max 50)" });

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true }).populate("organiser", "-password").populate("participants", "-password");
    res.json(updated);
  } catch (err) {
    console.error("PATCH /api/events/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/events/:id  - only organiser can delete, cascade related docs
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    if (!ev.organiser.equals(req.userId)) return res.status(403).json({ message: "Forbidden" });

    await Activity.deleteMany({ event: ev._id });
    await PlanningStep.deleteMany({ event: ev._id });
    await ev.deleteOne();

    res.json({ message: "Event and related data deleted" });
  } catch (err) {
    console.error("DELETE /api/events/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/events/:id/participants  - add a single participant (only organiser)
router.post("/:id/participants", requireAuth, async (req, res) => {
  try {
    const { participantId } = req.body || {};
    if (!participantId) return res.status(400).json({ message: "participantId is required" });

    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    if (!ev.organiser.equals(req.userId)) return res.status(403).json({ message: "Forbidden" });

    // check user exists
    const user = await User.findById(participantId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // prevent adding organiser or duplicates
    if (ev.organiser.equals(participantId)) return res.status(400).json({ message: "Organiser is already part of the event" });
    if (ev.participants.some((p) => p.equals(participantId))) return res.status(400).json({ message: "User is already a participant" });

    ev.participants.push(participantId);
    await ev.save();

    const updated = await Event.findById(ev._id).populate("organiser", "-password").populate("participants", "-password");
    res.status(200).json(updated);
  } catch (err) {
    console.error("POST /api/events/:id/participants error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/events/:id/participants/:pid  - remove a participant (only organiser)
router.delete("/:id/participants/:pid", requireAuth, async (req, res) => {
  try {
    const pid = req.params.pid;
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    if (!ev.organiser.equals(req.userId)) return res.status(403).json({ message: "Forbidden" });

    // cannot remove organiser here
    if (ev.organiser.equals(pid)) return res.status(400).json({ message: "Cannot remove organiser" });

    const idx = ev.participants.findIndex((p) => p.equals(pid));
    if (idx === -1) return res.status(404).json({ message: "Participant not found" });

    ev.participants.splice(idx, 1);
    await ev.save();

    const updated = await Event.findById(ev._id).populate("organiser", "-password").populate("participants", "-password");
    res.json(updated);
  } catch (err) {
    console.error("DELETE /api/events/:id/participants/:pid error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;