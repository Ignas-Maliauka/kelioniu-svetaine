import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date },
  endTime: { type: Date },
  location: { type: String },
});

export default mongoose.model("Activity", activitySchema);