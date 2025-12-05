import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 2, maxlength: 50 },
    description: { type: String, maxlength: 200 },
    startDate: { type: Date },
    endDate: { type: Date },
    location: { type: String, maxlength: 50 },
    state: {
      type: String,
      enum: ["planned", "ongoing", "completed", "cancelled"],
      default: "planned",
    },
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
    organisers: [
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
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model("Event", eventSchema);