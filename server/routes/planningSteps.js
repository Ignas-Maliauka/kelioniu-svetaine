import express from "express";
import PlanningStep from "../models/PlanningStep.js";
import Event from "../models/Event.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// read access allows organiser, organisers or participants
async function userHasReadAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { organisers: userId }, { participants: userId }] });
  return !!ev;
}

// write access requires organiser or promoted organisers
async function userHasWriteAccessToEvent(eventId, userId) {
  const ev = await Event.findOne({ _id: eventId, $or: [{ organiser: userId }, { organisers: userId }] });
  return !!ev;
}

// GET /api/planning-steps?event=<id>
router.get("/", requireAuth, async (req, res) => {
  try {
    const { event } = req.query;
    const filter = {};
    if (event) {
      const ok = await userHasReadAccessToEvent(event, req.userId);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      filter.event = event;
    } else {
      const evs = await Event.find({ $or: [{ organiser: req.userId }, { organisers: req.userId }, { participants: req.userId }] }).select("_id");
      filter.event = { $in: evs.map(e => e._id) };
    }

    const steps = await PlanningStep.find(filter)
      .sort({ dueDate: 1 })
      .populate("createdBy", "-password")
      .populate("updatedBy", "-password")
      .populate("completedBy", "-password");
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
    if (title.length < 2 || title.length > 50) return res.status(400).json({ message: "Title must be 2-50 characters" });
    if (description && description.length > 200) return res.status(400).json({ message: "Description too long (max 200)" });

    const ok = await userHasWriteAccessToEvent(event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const payload = { event, title, description, dueDate, isCompleted, createdBy: req.userId, updatedBy: req.userId };
    if(req.body.isCompleted === true) {payload.completedBy = req.userId;}
    else{
      payload.completedBy = undefined;
    }

    const step = await PlanningStep.create(payload);
    await Event.findByIdAndUpdate(event, { $push: { planningSteps: step._id } });

    const populated = await PlanningStep.findById(step._id)
      .populate("createdBy", "-password")
      .populate("updatedBy", "-password")
      .populate("completedBy", "-password");
    res.status(201).json(populated);
  } catch (err) {
    console.error("POST /api/planning-steps error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/planning-steps/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const step = await PlanningStep.findById(req.params.id)
      .populate("createdBy", "-password")
      .populate("updatedBy", "-password")
      .populate("completedBy", "-password");
    if (!step) return res.status(404).json({ message: "Planning step not found" });

    const ok = await userHasReadAccessToEvent(step.event, req.userId);
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

    const ok = await userHasWriteAccessToEvent(step.event, req.userId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const updates = (({ title, description, dueDate, isCompleted, updatedBy }) => ({ title, description, dueDate, isCompleted, updatedBy }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    if (updates.title && (updates.title.length < 2 || updates.title.length > 50)) return res.status(400).json({ message: "Title must be 2-50 characters" });
    if (updates.description && updates.description.length > 200) return res.status(400).json({ message: "Description too long (max 200)" });

    // if completedBy provided in payload, allow update
   if(req.body.isCompleted === true) {updates.completedBy = req.userId;}
    else{
      updates.completedBy = undefined;
    }
    const updated = await PlanningStep.findByIdAndUpdate(req.params.id, updates, { new: true });
    const populated = await PlanningStep.findById(updated._id)
      .populate("createdBy", "-password")
      .populate("updatedBy", "-password")
      .populate("completedBy", "-password");
    res.json(populated);
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

    const ok = await userHasWriteAccessToEvent(step.event, req.userId);
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