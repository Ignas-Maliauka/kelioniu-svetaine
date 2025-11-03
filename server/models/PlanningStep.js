import mongoose from "mongoose";

const planningStepSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  dueDate: { type: Date },
});

export default mongoose.model("PlanningStep", planningStepSchema);
