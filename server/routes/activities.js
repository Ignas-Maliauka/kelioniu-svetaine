import express from "express";
import Activity from "../models/Activity.js";
import Event from "../models/Event.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Helper: read access allows organiser, organisers or participants
async function userHasReadAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { organisers: userId }, { participants: userId }] });
  return !!ev;
}

// write access (create/update/delete) requires organiser or promoted organisers
async function userHasWriteAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { organisers: userId }] });
  return !!ev;
}

// GET /api/activities?event=<id>
router.get("/", requireAuth, async (req, res) => {
  try {
    const { event } = req.query;
    const filter = {};
    if (event) {
      const ok = await userHasReadAccessToEvent(event, req.userId);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      filter.event = event;
    } else {
      // return activities for events where user is organiser or participant
      const evs = await Event.find({ $or: [{ organiser: req.userId }, { organisers: req.userId }, { participants: req.userId }] }).select("_id");
      filter.event = { $in: evs.map(e => e._id) };
    }

    const activities = await Activity.find(filter)
      .sort({ startTime: 1 })
      .populate("createdBy", "-password")
      .populate("updatedBy", "-password");
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
    if (name.length < 2 || name.length > 50) return res.status(400).json({ message: "Name must be 2-50 characters" });
    if (description && description.length > 200) return res.status(400).json({ message: "Description too long (max 200)" });
    if (location && location.length > 50) return res.status(400).json({ message: "Location too long (max 50)" });

    const ok = await userHasWriteAccessToEvent(event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

  const act = await Activity.create({ event, name, description, startTime, endTime, location, createdBy: req.userId, updatedBy: req.userId });
  // optionally add to Event.activities array
  await Event.findByIdAndUpdate(event, { $push: { activities: act._id } });

  const populated = await Activity.findById(act._id).populate("createdBy", "-password").populate("updatedBy", "-password");
  res.status(201).json(populated);
  } catch (err) {
    console.error("POST /api/activities error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/activities/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
  const act = await Activity.findById(req.params.id).populate("createdBy", "-password").populate("updatedBy", "-password");
    if (!act) return res.status(404).json({ message: "Activity not found" });

    const ok = await userHasReadAccessToEvent(act.event, req.userId);
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

    const ok = await userHasWriteAccessToEvent(act.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const updates = (({ name, description, startTime, endTime, location, updatedBy }) => ({ name, description, startTime, endTime, location, updatedBy }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    if (updates.name && (updates.name.length < 2 || updates.name.length > 50)) return res.status(400).json({ message: "Name must be 2-50 characters" });
    if (updates.description && updates.description.length > 200) return res.status(400).json({ message: "Description too long (max 200)" });
    if (updates.location && updates.location.length > 50) return res.status(400).json({ message: "Location too long (max 50)" });

  const updated = await Activity.findByIdAndUpdate(req.params.id, updates, { new: true });
  const populated = await Activity.findById(updated._id).populate("createdBy", "-password").populate("updatedBy", "-password");
  res.json(populated);
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

    const ok = await userHasWriteAccessToEvent(act.event, req.userId);
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