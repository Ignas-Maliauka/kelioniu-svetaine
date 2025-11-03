import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  location: { type: String, trim: true },
  organiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  activities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
    },
  ],
  planningSteps: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlanningStep",
    },
  ],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Event || mongoose.model("Event", eventSchema);