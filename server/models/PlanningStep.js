import mongoose from "mongoose";

const planningStepSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  title: { type: String, required: true, minlength: 2, maxlength: 50 },
  description: { type: String, maxlength: 200 },
  isCompleted: { type: Boolean, default: false },
  dueDate: { type: Date },
});

export default mongoose.models.PlanningStep || mongoose.model("PlanningStep", planningStepSchema);
