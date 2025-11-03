import express from "express";
import Activity from "../models/Activity.js";
import Event from "../models/Event.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Helper: verify user has access to event (organiser or participant)
async function userHasAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { participants: userId }] });
  return !!ev;
}

// GET /api/activities?event=<id>
router.get("/", requireAuth, async (req, res) => {
  try {
    const { event } = req.query;
    const filter = {};
    if (event) {
      const ok = await userHasAccessToEvent(event, req.userId);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      filter.event = event;
    } else {
      // return activities for events the user is part of
      // find events first
      const evs = await Event.find({ $or: [{ organiser: req.userId }, { participants: req.userId }] }).select("_id");
      filter.event = { $in: evs.map(e => e._id) };
    }

    const activities = await Activity.find(filter).sort({ startTime: 1 });
    res.json(activities);
  } catch (err) {
    console.error("GET /api/activities error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/activities
router.post("/", requireAuth, async (req, res) => {
  try {
    const { event, name, description, startTime, endTime, location } = req.body || {};
    if (!event || !name) return res.status(400).json({ message: "Event and name are required" });

    const ok = await userHasAccessToEvent(event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const act = await Activity.create({ event, name, description, startTime, endTime, location });
    // optionally add to Event.activities array
    await Event.findByIdAndUpdate(event, { $push: { activities: act._id } });

    res.status(201).json(act);
  } catch (err) {
    console.error("POST /api/activities error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/activities/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const act = await Activity.findById(req.params.id);
    if (!act) return res.status(404).json({ message: "Activity not found" });

    const ok = await userHasAccessToEvent(act.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    res.json(act);
  } catch (err) {
    console.error("GET /api/activities/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/activities/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const act = await Activity.findById(req.params.id);
    if (!act) return res.status(404).json({ message: "Activity not found" });

    const ok = await userHasAccessToEvent(act.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const updates = (({ name, description, startTime, endTime, location }) => ({ name, description, startTime, endTime, location }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const updated = await Activity.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("PATCH /api/activities/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/activities/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const act = await Activity.findById(req.params.id);
    if (!act) return res.status(404).json({ message: "Activity not found" });

    const ok = await userHasAccessToEvent(act.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    await Activity.findByIdAndDelete(req.params.id);
    await Event.findByIdAndUpdate(act.event, { $pull: { activities: act._id } });

    res.json({ message: "Activity deleted" });
  } catch (err) {
    console.error("DELETE /api/activities/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;