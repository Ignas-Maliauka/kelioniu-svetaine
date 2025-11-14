import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  name: { type: String, required: true, minlength: 2, maxlength: 50 },
  description: { type: String, maxlength: 200 },
  startTime: { type: Date },
  endTime: { type: Date },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  location: { type: String, maxlength: 50 },
});

export default mongoose.models.Activity || mongoose.model("Activity", activitySchema);