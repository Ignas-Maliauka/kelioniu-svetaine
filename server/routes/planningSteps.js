import express from "express";
import PlanningStep from "../models/PlanningStep.js";
import Event from "../models/Event.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

async function userHasAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { participants: userId }] });
  return !!ev;
}

// GET /api/planning-steps?event=<id>
router.get("/", requireAuth, async (req, res) => {
  try {
    const { event } = req.query;
    const filter = {};
    if (event) {
      const ok = await userHasAccessToEvent(event, req.userId);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      filter.event = event;
    } else {
      const evs = await Event.find({ $or: [{ organiser: req.userId }, { participants: req.userId }] }).select("_id");
      filter.event = { $in: evs.map(e => e._id) };
    }

    const steps = await PlanningStep.find(filter).sort({ dueDate: 1 });
    res.json(steps);
  } catch (err) {
    console.error("GET /api/planning-steps error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/planning-steps
router.post("/", requireAuth, async (req, res) => {
  try {
    const { event, title, description, dueDate, isCompleted } = req.body || {};
    if (!event || !title) return res.status(400).json({ message: "Event and title are required" });

    const ok = await userHasAccessToEvent(event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const step = await PlanningStep.create({ event, title, description, dueDate, isCompleted });
    await Event.findByIdAndUpdate(event, { $push: { planningSteps: step._id } });

    res.status(201).json(step);
  } catch (err) {
    console.error("POST /api/planning-steps error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/planning-steps/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const step = await PlanningStep.findById(req.params.id);
    if (!step) return res.status(404).json({ message: "Planning step not found" });

    const ok = await userHasAccessToEvent(step.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    res.json(step);
  } catch (err) {
    console.error("GET /api/planning-steps/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/planning-steps/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const step = await PlanningStep.findById(req.params.id);
    if (!step) return res.status(404).json({ message: "Planning step not found" });

    const ok = await userHasAccessToEvent(step.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const updates = (({ title, description, dueDate, isCompleted }) => ({ title, description, dueDate, isCompleted }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const updated = await PlanningStep.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("PATCH /api/planning-steps/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/planning-steps/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const step = await PlanningStep.findById(req.params.id);
    if (!step) return res.status(404).json({ message: "Planning step not found" });

    const ok = await userHasAccessToEvent(step.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    await PlanningStep.findByIdAndDelete(req.params.id);
    await Event.findByIdAndUpdate(step.event, { $pull: { planningSteps: step._id } });

    res.json({ message: "Planning step deleted" });
  } catch (err) {
    console.error("DELETE /api/planning-steps/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;